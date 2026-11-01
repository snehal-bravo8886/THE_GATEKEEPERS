# Thread & Thimble — Local Dress Shop Security Lab

A small fictional dress shop website with fake products and demo accounts. It deliberately includes three security flaws so you can learn how to recognise broken access control and business-logic validation problems.

## Safety boundary

- The server binds to `127.0.0.1` only. It is intended to run on your own computer.
- All products, users and orders are fictional.
- Do not deploy this project, port-forward it, expose it to a public network or use its test actions against a real shop or college website.
- This is a learning prototype, not production-ready authentication or a secure commerce application.

## Requirements

- Node.js 18 or newer
- No additional npm packages are required

## Run it on Windows

1. Extract the ZIP file.
2. Open the extracted `dress-shop-security-lab` folder in VS Code.
3. In VS Code, choose **Terminal – New Terminal**.
4. Run:

 ```bash
  npm start
  ```

5. Open `http://localhost:3000` in your browser.
6. Sign in with **Alice · Customer** to begin.

To stop the server, return to the VS Code terminal and press `Ctrl + C`.
