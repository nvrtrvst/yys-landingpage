module.exports = {
  apps: [
    {
      name: "cms-main",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 5000",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        NEXTAUTH_URL: "https://nuurulmuttaqiin.or.id",
      },
    },
    {
      name: "cms-mading",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 5001",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        NEXTAUTH_URL: "https://penamaya.nuurulmuttaqiin.or.id",
      },
    },
  ],
};
