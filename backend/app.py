from flask import Flask, request, jsonify
from flask_cors import CORS
import paramiko
import pandas as pd
from io import StringIO
from plotly.utils import PlotlyJSONEncoder
import json
import re
import plotly.express as px
import plotly.graph_objects as go
import plotly.io as pio
from datetime import datetime
import openpyxl
import os
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

def ssh_login(username, password, ip):
    '''
    Login function to capture user password and username for ssh connection
    '''
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=username, password=password)
        stdin, stdout, stderr = ssh.exec_command('df -h')
        out = stdout.read().decode(errors='ignore')
        err = stderr.read().decode(errors='ignore')
        return True, out if out.strip() else (err or "Command executed with no output.")
    except Exception as e:
        return False, f"Login Failed: {str(e)}"
    finally:
        try:
            if ssh:
                ssh.close()
        except Exception:
            pass

def save_pie_png(fig_pie):
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    path = f"disk_pie_{ts}.png"
    try:
        pio.write_image(fig_pie, path, format="png", width=900, height=500)
    except Exception as e:
        print("PNG export failed:", e)
        return None
    return path

def save_table_xlsx(table):
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    path = f"disk_table_{ts}.xlsx"
    try:
        with pd.ExcelWriter(path) as writer:
            table.to_excel(writer, sheet_name="Sheet1", index=False)
    except Exception as e:
        print(f"failed to save table to excel: {e}")
        return None
    return path

def upload_png(bot, png_path):
    message = "Hi team, We are running low on disk space please check the graph and table to see if you are to blame"
    new_file = bot["client"].files_upload_v2(
        channel=bot["channel"],
        file=f"./{png_path}",
        title="Disk usage chart",
        initial_comment=message,
    )

def upload_xlsx(bot, table_path):
    new_file = bot['client'].files_upload_v2(
        channel=bot["channel"],
        file= f"./{table_path}",
        title="Disk Usage Table"
    )

def initialise_slackbot():
    '''
    Builds a dictionary to store all the infomation needed to send slack updates
    '''
    client = WebClient(token=os.environ["SLACK_BOT_TOKEN"])
    channel_id = os.environ["SLACK_CHANNEL_ID"]
    bot_name = "disk usage bot"

    bot = {'name':bot_name, 'channel':channel_id, 'client': client}

    return bot


def convert_to_mb(str_size):
    '''
    Converts gb, Mb, Tb, and Kb to mb for calculations
    '''
    if str_size.endswith('G'):
        val = str_size[:-1]
        return float(val) * 1000
    elif str_size.endswith('M'):
        val = str_size[:-1]
        return float(val)
    elif str_size.endswith('T'):
        val = str_size[:-1]
        return float(val) * 1000000
    elif str_size.endswith('K'):
        val = str_size[:-1]
        return float(val) / 1000
    return 0.0

def processing_data(data):
    '''
    Reads output of df command, performs some transformations on the data, and creates figures
    '''
    sizeMB = []
    usedMB = []
    usage_percentage = []
    df = pd.read_csv(StringIO(data), delim_whitespace=True)
    df['Filesystem'] = df['Filesystem'].str.replace(
        r'^.*amazonaws.com:', '', regex=True
    )
    for index, row in df.iterrows():
        sizeMB.append(convert_to_mb(row['Size']))
        usedMB.append(convert_to_mb(row['Used']))
    df.insert(1, 'Size(MB)', sizeMB)
    df.insert(2, 'Used(MB)', usedMB)

    total = df['Size(MB)'].sum()
    for index, row in df.iterrows():
        usage_percentage.append((row['Used(MB)'] / total) * 100)
    df.insert(3, 'Usage(%)', usage_percentage)
    df_to_plot = df.drop(df[df['Usage(%)'] < 0.1 ].index)
    fig_pie = px.pie(df_to_plot, values='Usage(%)', names='Filesystem', title='High level Disk Usage Distribution')
    fig_table = df.drop(['Size(MB)','Used(MB)', 'Avail', 'Use%', 'on'], axis=1)
    fig_table.sort_values(by='Usage(%)', ascending=False, inplace=True)
    return fig_pie, fig_table

bot = initialise_slackbot()

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True})

@app.route('/', methods=['POST'])
def get_login():
    '''
    Gets all login data from user input, collects data from etx instance, and sends figures to frontend
    '''
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    password = data.get('password')
    ip = data.get('ip')

    if not username or not password or not ip:
        return jsonify({"ok": False, "message": "Username, password and ip required"}), 400
    
    ok, message = ssh_login(username, password, ip)
    if not ok:
        return jsonify({"ok" : False, "message" : message}), 401
    print(f"Login attempt for {username} at {ip}: {'Success' if ok else 'Failure'}")

    fig_pie, fig_table = processing_data(message)

    png_path = save_pie_png(fig_pie)
    table_path = save_table_xlsx(fig_table)

    safe_fig_pie = json.loads(json.dumps(fig_pie, cls=PlotlyJSONEncoder))
    return jsonify({"ok": ok, "message": message, "figure_pie": safe_fig_pie, "figure_table": fig_table.to_dict(orient='records'), "png_path": png_path, "table_path": table_path})

@app.route("/command", methods=['POST'])
def get_command():
    '''
    gets signal to send slackbot message when user presses frontend's button to send a reminder
    '''
    data = request.get_json(silent=True) or {}
    if data.get("command" != "send_reminder"):
        return jsonify({"ok": False, "message":"Unknown command"}), 400
    
    payload = data.get("payload")
    fig_path = payload.get("png_path")
    table_path = payload.get("table_path")
    upload_png(bot, fig_path)
    upload_xlsx(bot, table_path)
    return jsonify({"ok": True, "message": "Reminder Sent"})

if __name__ == '__main__':
    app.run(ssl_context='adhoc', host='127.0.0.1', port = 5000, debug=True)
