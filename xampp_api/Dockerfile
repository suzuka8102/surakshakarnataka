FROM php:8.2-apache

# Enable Apache modules
RUN a2enmod rewrite headers

# Install PDO MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Copy API files
COPY . /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html

# Configure Apache to use Railway's PORT env variable
RUN echo 'ServerName localhost' >> /etc/apache2/apache2.conf
RUN echo '<Directory /var/www/html>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/apache2.conf

# Script to update Apache port from Railway PORT env variable
RUN echo '#!/bin/bash\n\
PORT=${PORT:-80}\n\
sed -i "s/Listen 80/Listen $PORT/" /etc/apache2/ports.conf\n\
sed -i "s/:80/:$PORT/" /etc/apache2/sites-enabled/000-default.conf\n\
apache2-foreground' > /start.sh && chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
