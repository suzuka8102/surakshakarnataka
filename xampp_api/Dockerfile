FROM php:8.2-apache

# Enable Apache modules
RUN a2enmod rewrite headers

# Install PDO MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Copy API files
COPY . /var/www/html/

# Apache config - allow .htaccess
RUN echo '<Directory /var/www/html>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/apache2.conf

# Set permissions
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
