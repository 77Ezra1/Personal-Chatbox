#!/usr/bin/env python3
"""
Flask应用包装器,用于部署Personal Chatbox
"""
import os
import subprocess
import signal
import sys
import requests
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS

app = Flask(__name__, static_folder='dist', static_url_path='')
CORS(app, origins='*', supports_credentials=True)

# 后端进程
backend_process = None
BACKEND_URL = 'http://localhost:3001'

def start_backend():
    """启动Node.js后端服务"""
    global backend_process
    env = os.environ.copy()
    env['NODE_ENV'] = 'production'
    env['HOST'] = '0.0.0.0'
    env['PORT'] = '3001'
    
    backend_process = subprocess.Popen(
        ['node', 'server/index.cjs'],
        env=env,
        cwd=os.path.dirname(os.path.abspath(__file__)),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    print(f"后端服务已启动 (PID: {backend_process.pid})")

def stop_backend():
    """停止后端服务"""
    global backend_process
    if backend_process:
        backend_process.terminate()
        backend_process.wait()
        print("后端服务已停止")

@app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def proxy_api(path):
    """代理API请求到后端"""
    url = f"{BACKEND_URL}/api/{path}"
    
    # 转发请求
    try:
        resp = requests.request(
            method=request.method,
            url=url,
            headers={key: value for (key, value) in request.headers if key != 'Host'},
            data=request.get_data(),
            cookies=request.cookies,
            allow_redirects=False,
            timeout=30
        )
        
        # 构建响应
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        headers = [(name, value) for (name, value) in resp.raw.headers.items()
                   if name.lower() not in excluded_headers]
        
        response = app.make_response((resp.content, resp.status_code, headers))
        return response
    except Exception as e:
        print(f"API代理错误: {e}")
        return jsonify({'error': 'Backend service unavailable'}), 503

@app.route('/')
def index():
    """返回前端首页"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    """处理静态文件"""
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        # SPA路由,返回index.html
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/health')
def health():
    """健康检查"""
    return jsonify({'status': 'ok', 'service': 'Personal Chatbox'})

def signal_handler(sig, frame):
    """处理终止信号"""
    print("\n正在关闭服务...")
    stop_backend()
    sys.exit(0)

if __name__ == '__main__':
    # 注册信号处理
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # 启动后端
    start_backend()
    
    # 等待后端启动
    import time
    time.sleep(5)
    
    # 启动Flask
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

