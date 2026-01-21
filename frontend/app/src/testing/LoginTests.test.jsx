import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useNavigate } from 'react-router-dom';
import Login from "../pages/Login.js";

// mock react-router navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

beforeEach(() => {
  mockNavigate.mockReset();
  global.fetch = jest.fn();
  jest.spyOn(window, "alert").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  window.alert.mockRestore();
  console.error.mockRestore();
});

test("renders login UI", () => {
  render(<Login />);

  expect(screen.getByText("ETX Login")).toBeInTheDocument();
  expect(screen.getByText(/Enter your username/i)).toBeInTheDocument();

  expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/IP address/i)).toBeInTheDocument();

  expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
});

test("updates controlled inputs", async () => {
  const user = userEvent.setup();
  render(<Login />);

  const username = screen.getByPlaceholderText(/Username/i);
  const password = screen.getByPlaceholderText(/Password/i);
  const ip = screen.getByPlaceholderText(/IP address/i);

  await user.type(username, "aleks");
  await user.type(password, "secret");
  await user.type(ip, "10.0.0.1");

  expect(username).toHaveValue("aleks");
  expect(password).toHaveValue("secret");
  expect(ip).toHaveValue("10.0.0.1");
});

test("submits and calls fetch with correct payload", async () => {
  const user = userEvent.setup();
  global.fetch.mockResolvedValue({
    json: async () => ({ ok: false, message: "nope" }),
  });

  render(<Login />);

  await user.type(screen.getByPlaceholderText(/Username/i), "u");
  await user.type(screen.getByPlaceholderText(/Password/i), "p");
  await user.type(screen.getByPlaceholderText(/IP address/i), "1.2.3.4");
  await user.click(screen.getByRole("button", { name: /login/i }));

  expect(global.fetch).toHaveBeenCalledTimes(1);
  const [url, options] = global.fetch.mock.calls[0];

  expect(url).toBe("https://127.0.0.1:5000/");
  expect(options.method).toBe("POST");
  expect(options.headers["Content-Type"]).toBe("application/json");
  expect(JSON.parse(options.body)).toEqual({
    username: "u",
    password: "p",
    ip: "1.2.3.4",
  });
});

test("successful login navigates to /Data with state", async () => {
  const user = userEvent.setup();
  global.fetch.mockResolvedValue({
    json: async () => ({
      ok: true,
      figure_pie: { data: [], layout: {} },
      figure_table: [{ a: 1 }],
      png_path: "chart.png",
      table_path: "table.csv",
    }),
  });

  render(<Login />);

  await user.type(screen.getByPlaceholderText(/Username/i), "u");
  await user.type(screen.getByPlaceholderText(/Password/i), "p");
  await user.type(screen.getByPlaceholderText(/IP address/i), "1.2.3.4");
  await user.click(screen.getByRole("button", { name: /login/i }));

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1));
  expect(mockNavigate).toHaveBeenCalledWith("/Data", {
    state: {
      figure: { data: [], layout: {} },
      figure_table: [{ a: 1 }],
      png_path: "chart.png",
      table_path: "table.csv",
    },
  });

  expect(window.alert).not.toHaveBeenCalled();
});

test("failed login shows alert and does not navigate", async () => {
  const user = userEvent.setup();
  global.fetch.mockResolvedValue({
    json: async () => ({ ok: false, message: "Bad creds" }),
  });

  render(<Login />);

  await user.type(screen.getByPlaceholderText(/Username/i), "u");
  await user.type(screen.getByPlaceholderText(/Password/i), "p");
  await user.type(screen.getByPlaceholderText(/IP address/i), "1.2.3.4");
  await user.click(screen.getByRole("button", { name: /login/i }));

  await waitFor(() => expect(window.alert).toHaveBeenCalled());
  expect(window.alert).toHaveBeenCalledWith("Login failed: Bad creds");
  expect(mockNavigate).not.toHaveBeenCalled();
});

test("network error shows HTTPS adhoc guidance alert", async () => {
  const user = userEvent.setup();
  global.fetch.mockRejectedValue(new Error("ERR_CERT_AUTHORITY_INVALID"));

  render(<Login />);

  await user.type(screen.getByPlaceholderText(/Username/i), "u");
  await user.type(screen.getByPlaceholderText(/Password/i), "p");
  await user.type(screen.getByPlaceholderText(/IP address/i), "1.2.3.4");
  await user.click(screen.getByRole("button", { name: /login/i }));

  await waitFor(() => expect(window.alert).toHaveBeenCalled());
  expect(window.alert.mock.calls[0][0]).toMatch(/Request failed/i);
  expect(mockNavigate).not.toHaveBeenCalled();
});
