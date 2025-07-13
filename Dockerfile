FROM denoland/deno:alpine

WORKDIR /app

COPY . .

CMD ["run", "--allow-net", "main.ts"]
