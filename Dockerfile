FROM nginx:alpine
RUN apk add --no-cache openssl
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
CMD sh -c "sed -i 's/\$PORT/'\"${PORT:-80}\"'/g' /etc/nginx/conf.d/default.conf.template && cp /etc/nginx/conf.d/default.conf.template /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
