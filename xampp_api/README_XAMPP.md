# XAMPP Setup — Copy This Folder

Copy everything inside this `xampp_api/` folder to:
  C:\xampp\htdocs\surakshakarnataka\

So it looks like:
  C:\xampp\htdocs\surakshakarnataka\api.php
  C:\xampp\htdocs\surakshakarnataka\config.php
  C:\xampp\htdocs\surakshakarnataka\test.php
  C:\xampp\htdocs\surakshakarnataka\.htaccess

Then:
1. Open phpMyAdmin → http://localhost/phpmyadmin
2. Create database: surakshakarnataka
3. Import: database/surakshakarnataka.sql
4. Test: http://localhost/surakshakarnataka/test.php
   → Should show all tables with counts

Run React app:
  npm install
  npm run dev
  → Opens at http://localhost:3000

Login credentials:
  rajesh@citizen.in / Citizen@123        (Dandeli citizen)
  sho.dandeli@ksp.gov.in / Police@123    (Dandeli SHO)
  sp.uk@ksp.gov.in / SP@123             (SP Uttara Kannada)
  sho.cubbonpark@ksp.gov.in / Police@123
  cp.bengaluru@ksp.gov.in / Commissioner@123
  sp.dk@ksp.gov.in / SP@123
