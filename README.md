# AI Agent – Free Next.js Landing Page Template

#### Preview

 - [Demo](https://themewagon.github.io/agent-ai/)

#### Download
 - [Download from ThemeWagon](https://themewagon.com/themes/agent-ai/)

## Getting Started

### Local GPT setup

GPT chat reads its API key from `config/openai.json`, which is ignored by Git.
Create the file locally with:

```json
{
  "apiKey": "your-openai-api-key"
}
```

You can also let `scripts/setup-live2d-local.ps1` create the file for you during Live2D setup, then edit the key locally.

1. Clone Repository
```
git clone https://github.com/themewagon/agent-ai.git
```
2. Install Dependencies
```
npm i
```
3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Local Live2D Setup

Live2D SDK files are not committed to this repository. Each developer should download the official Cubism SDK for Web locally and copy the required files with the setup script.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-live2d-local.ps1 -SdkRoot "C:\Users\ictedu\Downloads\CubismSdkForWeb-5-r.5" -ModelName "roboko"
```

The script copies local-only files into:

- `app/live2d/`
- `components/live2d/`
- `lib/live2d-local/`
- `lib/live2d-sdk/`
- `public/live2d/`

Those folders are ignored by Git, so the SDK, model resources, and generated Live2D route stay out of GitHub.
After running the script, open `/live2d` from the main page AI button.

## Author 
```
Design and code is completely written by CodesCandy and development team. 
```

## License

 - Design and Code is Copyright &copy; <a href="https://codescandy.com/" target="_blank">CodesCandy</a>
 - Licensed cover under [MIT]
 - Distributed by <a href="https://themewagon.com" target="_blank">ThemeWagon</a>
