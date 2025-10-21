# FaceFusion 安装指南（Windows）

本文整合官方仓库 <https://github.com/facefusion/facefusion> 与安装文档 <https://docs.facefusion.io/installation> 的信息，为 Windows 10/11 用户提供完整的本地部署步骤。内容覆盖前置环境、依赖安装、模型下载、运行验证及常见问题排查。默认使用 PowerShell，若使用 cmd 或其他终端请根据语法调整。

## 适用范围
- 目标：在本地运行 FaceFusion CLI 或 Web UI，并准备好后续处理所需的模型文件。
- 平台：Windows 10/11（64 位），可扩展到 WSL，但本文聚焦原生 Windows。
- GPU：流程兼容纯 CPU、NVIDIA CUDA、DirectML；具体加速能力取决于硬件与驱动。

## 1. 系统与硬件要求
| 组件 | 基本要求 | 建议 |
| --- | --- | --- |
| 操作系统 | Windows 10/11 64 位 | 保持最新补丁 |
| CPU | 任意 x86_64 | AVX2 支持有助于性能 |
| 内存 | ≥ 8 GB | 16 GB 以上处理 4K 视频更稳 |
| GPU（可选） | NVIDIA 6GB+ 显存 / 支持 DirectML 的 GPU | 使用 CUDA 12.x + 最新驱动 |
| 磁盘空间 | ≥ 10 GB | 模型缓存与输出文件可能显著增加 |

## 2. 安装前准备

### 2.1 Python
1. 从 <https://www.python.org/downloads/windows/> 下载 Python 3.10 或 3.11 安装包（FaceFusion 暂不支持 3.12+/3.13）。
2. 安装时勾选 “Add python.exe to PATH”。
3. 已安装 3.13 时无需卸载，新增安装 3.11（或 3.10）即可共存。推荐勾选 “Use admin privileges when installing py.exe” 以便使用 `py` 启动器管理版本。
4. 完成后验证：
   ```powershell
   python --version
   pip --version
   ```
5. 如需确认特定版本，使用：
   ```powershell
   py -3.11 --version
   py -3.11 -m pip --version
   ```
   如果默认 `python --version` 仍显示 3.13 属于正常现象，后续通过 `py -3.11` 或以 `.venv` 激活后的解释器运行 FaceFusion 即可。

### 2.2 Git
- 从 <https://git-scm.com/download/win> 获取最新版本，按默认选项安装。
- 验证：
  ```powershell
  git --version
  ```

### 2.3 FFmpeg
1. 下载 `ffmpeg-release-essentials.zip`：<https://www.gyan.dev/ffmpeg/builds/>.
2. 解压到如 `C:\Tools\ffmpeg`.
3. 将 `C:\Tools\ffmpeg\bin` 添加到系统 `Path` 环境变量。
4. 新开 PowerShell 验证：
   ```powershell
   ffmpeg -version
   ```

### 2.4 GPU 依赖（仅当需要加速）
- **仅 CPU（无独显）**：跳过本节。FaceFusion 将完全使用 CPU，启动时指定 `--execution-provider cpu`。处理速度取决于核心数量和 AVX2 支持，长视频需预留更多时间。
- **NVIDIA CUDA**：安装与显卡兼容的 NVIDIA 驱动 + CUDA Toolkit（建议 12.x）。CUDA 装完后再安装对应版本的 cuDNN。
- **DirectML（AMD / Intel Arc）**：确保 Windows 和显卡驱动为最新，后续运行时将 `--execution-provider directml`。

## 3. 克隆仓库并创建工作目录
```powershell
cd D:\Projects  # 换成你的目标目录
git clone https://github.com/facefusion/facefusion.git
cd facefusion
```

如需更快下载，可参考 `docs/setup/GIT_CLONE_SPEEDUP.md` 中的代理方法。

## 4. 建立隔离 Python 环境
建议使用 `venv`，也可选择 Conda。以下为 `venv` 流程（确保指向 3.11）：
```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

若遇到 “running scripts is disabled”：
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```
重新打开 PowerShell 后再次激活虚拟环境。

## 5. 安装依赖
在虚拟环境内执行：
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

可选增强（如 CodeFormer、GFPGAN）：
```powershell
pip install -r requirements-optional.txt
```

**CUDA 用户**：若 `requirements.txt` 未自动安装带 CUDA 的 PyTorch，可手动安装，例如：
```powershell
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```
选择与本机 CUDA 匹配的渠道版本，详情参考 <https://pytorch.org/get-started/locally/>.

## 6. 模型权重准备
- 默认首次运行会从官方镜像自动下载常用模型（如 `inswapper_128.onnx`、`retinaface_10g.onnx`）。若网络环境受限，提前在联网环境下载后放置于 `models` 目录。
- 模型分类示例：
  - `models/detection`: 如 `retinaface_10g.onnx`
  - `models/recognition`: 如 `arcface_w600k_r50.onnx`
  - `models/fusion`: 如 `inswapper_128.onnx`
  - `models/enhancement`: GFPGAN、CodeFormer
- 官方文档列出了完整路径规则：<https://docs.facefusion.io/installation/models>.

## 7. 启动 FaceFusion

### 7.1 Web UI 模式
```powershell
python facefusion.py run --gui streamlit --execution-provider cpu
```
- 常用参数：
  - `--execution-provider`: `cpu`（示例）、`cuda`、`directml`、`onnxruntime`
  - `--skip-download`: 若模型已手动放置，避免重复下载
  - `--listen`: 指定绑定地址（默认 127.0.0.1）
  - `--port`: 默认 7860，可改成其他端口
- 启动成功后浏览器访问 <http://127.0.0.1:7860>。

### 7.2 CLI 批处理
```powershell
python facefusion.py run `
  --execution-provider cpu `
  --target .\samples\target.mp4 `
  --source .\samples\source.jpg `
  --output .\outputs\result.mp4
```
使用反引号 (`) 作为 PowerShell 多行续行符。所有参数可通过 `python facefusion.py --help` 查看。

## 8. 验证安装
1. 下载仓库自带的 `samples` 输入文件。
2. 启动 Web UI，加载示例源图与目标视频，运行一次换脸。CPU 模式下渲染时间会明显变长，耐心等待直到进度条完成。
3. 确认 `outputs` 目录生成结果文件且可正常播放。
4. 在 PowerShell 中查看日志确认无报错：
   ```powershell
   Get-Content .\logs\facefusion.log -Tail 20
   ```

## 9. 常见问题排查
- **`ModuleNotFoundError`**：确认虚拟环境已激活，重新执行 `pip install -r requirements.txt`。
- **`TORCH CUDA error`**：检查 CUDA、cuDNN 与 torch 版本；若机器 CUDA 版本较旧，安装对应版本的 torch wheel。
- **模型下载失败**：手动下载并放置在 `models` 目录，或配置系统代理后重新启动。
- **端口被占用**：启动命令增加 `--port 7861` 等自定义端口。
- **CPU 运行缓慢**：降低目标分辨率、缩短视频长度，或分段处理素材，FaceFusion 会自动利用多核心但仍可能耗时。
- **DirectML 性能低**：DirectML 兼容性好但速度不如 CUDA，可尝试降低输出分辨率或改用 CPU 模式比较效果。
- **启动 UI 空白**：清理浏览器缓存或换 Chrome/Edge，确保 Streamlit 未被企业安全策略拦截。

## 10. 后续操作建议
- **版本更新**：定期 `git pull` 获取最新代码，再次运行安装命令以同步依赖。
- **模型管理**：大模型体积较大，建议将常用模型缓存到本地 NAS 或移动硬盘，便于多台设备复用。
- **自动化脚本**：可将激活虚拟环境与启动命令写入 `start-facefusion.ps1` 以便一键开启。
- **安全合规**：遵守 MIT 许可及当地法规，避免在未经许可的素材上运行换脸操作。

至此，FaceFusion 在 Windows 的本地部署流程完整结束。如需 Linux、macOS 或 Docker 部署，可参考官方文档对应章节，再结合本文思路调整命令。祝使用顺利！
