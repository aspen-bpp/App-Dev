import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DataPage from "../pages/DataPage";

// ---- Mocks ----

// Mock Plotly component so JSDOM doesn't explode
jest.mock("react-plotly.js", () => (props) => (
  <div data-testid="plotly-mock">
    plotly-mock
    {/* optional: expose that it received data */}
    <span data-testid="plotly-data-len">{props?.data?.length ?? 0}</span>
  </div>
));

// Mock router hooks/components used by DataPage
const mockUseLocation = jest.fn();
jest.mock("react-router-dom", () => ({
  useLocation: () => mockUseLocation(),
  Link: ({ to, children, ...rest }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  global.fetch = jest.fn();
  jest.spyOn(window, "alert").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {}); // DataPage logs preview
});

afterEach(() => {
  window.alert.mockRestore();
  console.error.mockRestore();
  console.log.mockRestore();
});

const makeLocationState = (overrides = {}) => ({
  state: {
    figure: { data: [{ type: "pie" }], layout: { title: "Test" } },
    figure_table: [
      { Filesystem: "/a", Used: "10G", "Usage(%)": 5 },
      { Filesystem: "/b", Used: "20G", "Usage(%)": 10 },
    ],
    png_path: "disk_pie.png",
    table_path: "table.csv",
    ...overrides,
  },
});

test("renders insufficient data screen when neither fig nor table exists", () => {
  mockUseLocation.mockReturnValue({ state: undefined });

  render(<DataPage />);

  expect(screen.getByText(/Insufficient Data to Display/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /go back/i })).toHaveAttribute(
    "href",
    "/"
  );
});

test("renders 'Insufficient Data' card when fig or table missing (but not both)", () => {
  // fig exists, table missing -> should show the in-page insufficient card
  mockUseLocation.mockReturnValue(makeLocationState({ figure_table: undefined }));

  render(<DataPage />);

  expect(screen.getByText(/Insufficient Data/i)).toBeInTheDocument();
  expect(
    screen.getByText(/No figure or table data was passed/i)
  ).toBeInTheDocument();

  // still has a back link
  expect(screen.getByRole("link", { name: /go back/i })).toHaveAttribute(
    "href",
    "/"
  );
});

test("renders chart + table when fig and fig_table exist", () => {
  mockUseLocation.mockReturnValue(makeLocationState());

  render(<DataPage />);

  // header
  expect(screen.getByText(/Disk Usage/i)).toBeInTheDocument();
  expect(
    screen.getByText(/Summary chart and detailed filesystem breakdown/i)
  ).toBeInTheDocument();

  // plotly mock rendered
  expect(screen.getByTestId("plotly-mock")).toBeInTheDocument();
  expect(screen.getByTestId("plotly-data-len")).toHaveTextContent("1");

  // table headers derived from keys of first row
  expect(screen.getByRole("columnheader", { name: "Filesystem" })).toBeInTheDocument();
  expect(screen.getByRole("columnheader", { name: "Used" })).toBeInTheDocument();
  expect(screen.getByRole("columnheader", { name: "Usage(%)" })).toBeInTheDocument();

  // table body cells
  expect(screen.getByText("/a")).toBeInTheDocument();
  expect(screen.getByText("/b")).toBeInTheDocument();

  // row count badge
  expect(screen.getByText(/2 rows/i)).toBeInTheDocument();
});

test("clicking Send Reminder posts png_path and table_path to /command (success)", async () => {
  const user = userEvent.setup();
  mockUseLocation.mockReturnValue(makeLocationState());

  global.fetch.mockResolvedValue({
    json: async () => ({ ok: true }),
  });

  render(<DataPage />);

  await user.click(screen.getByRole("button", { name: /send reminder/i }));

  expect(global.fetch).toHaveBeenCalledTimes(1);

  const [url, options] = global.fetch.mock.calls[0];
  expect(url).toBe("https://127.0.0.1:5000/command");
  expect(options.method).toBe("POST");
  expect(options.headers["Content-Type"]).toBe("application/json");

  const body = JSON.parse(options.body);
  expect(body).toEqual({
    command: "send_reminder",
    payload: {
      png_path: "disk_pie.png",
      table_path: "table.csv",
    },
  });

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Slack reminder sent!");
  });
});

test("Send Reminder shows backend error message when ok=false", async () => {
  const user = userEvent.setup();
  mockUseLocation.mockReturnValue(makeLocationState());

  global.fetch.mockResolvedValue({
    json: async () => ({ ok: false, message: "Slack failed" }),
  });

  render(<DataPage />);

  await user.click(screen.getByRole("button", { name: /send reminder/i }));

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Slack failed");
  });
});

test("Send Reminder handles network failure", async () => {
  const user = userEvent.setup();
  mockUseLocation.mockReturnValue(makeLocationState());

  global.fetch.mockRejectedValue(new Error("network down"));

  render(<DataPage />);

  await user.click(screen.getByRole("button", { name: /send reminder/i }));

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/Failed to send reminder/i));
  });
});