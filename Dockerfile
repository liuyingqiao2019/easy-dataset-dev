# 使用Node.js 18作为基础镜像
FROM docker.1ms.run/library/node:18

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    expect \ 
    && rm -rf /var/lib/apt/lists/*

# 复制package.json和package-lock.json
COPY package.json package-lock.json* ./

# 安装依赖
#使用国内源加速
#RUN pnpm config set registry https://registry.npmmirror.com && pnpm install
#正常安装
RUN pnpm install

# 复制所有文件
COPY . .

# 使用 expect 自动化交互（完整脚本）
#这里需要对canvas依赖进行编译才能正常使用视觉模型解析pdf
RUN expect -c "\
    spawn pnpm approve-builds; \
    expect \"Choose which packages to build\"; \
    send \" \\n\"; \
    expect \"Do you approve?\"; \
    send \"y\\n\"; \ 
    after  30000; \
    expect eof" 

# 构建应用
RUN pnpm build

# 暴露端口
EXPOSE 1717

# 启动应用
CMD ["pnpm", "start"]