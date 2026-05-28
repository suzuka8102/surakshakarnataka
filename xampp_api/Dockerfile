FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    php8.1 \
    php8.1-mysql \
    php8.1-cli \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-8080} -t /app /app/router.php"]
