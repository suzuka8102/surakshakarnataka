-- ============================================================
-- SurakshaKarnataka — Karnataka Crime Management System
-- Clean SQL — Generated from single source of truth
-- Compatible with MariaDB 10.4 / MySQL 8
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `surakshakarnataka`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `surakshakarnataka`;

-- Drop all tables in safe order
DROP TABLE IF EXISTS `audit_log`;
DROP TABLE IF EXISTS `case_timeline`;
DROP TABLE IF EXISTS `evidence`;
DROP TABLE IF EXISTS `advisories`;
DROP TABLE IF EXISTS `event_permissions`;
DROP TABLE IF EXISTS `lost_articles`;
DROP TABLE IF EXISTS `tenant_verifications`;
DROP TABLE IF EXISTS `senior_citizens`;
DROP TABLE IF EXISTS `wanted_persons`;
DROP TABLE IF EXISTS `missing_persons`;
DROP TABLE IF EXISTS `criminals`;
DROP TABLE IF EXISTS `firs`;

-- ============================================================
-- TABLE: noc_applications
-- ============================================================
DROP TABLE IF EXISTS `noc_applications`;
CREATE TABLE `noc_applications` (
  `noc_id` VARCHAR(30) NOT NULL,
  `applicant_name` VARCHAR(150) NOT NULL,
  `applicant_phone` VARCHAR(15) NOT NULL,
  `applicant_address` TEXT NOT NULL,
  `noc_type` ENUM('Passport','Arms Licence','Loudspeaker','Character Certificate','Other') NOT NULL DEFAULT 'Passport',
  `passport_file_no` VARCHAR(50) DEFAULT NULL,
  `date_of_birth` DATE DEFAULT NULL,
  `purpose` TEXT DEFAULT NULL,
  `event_date` DATE DEFAULT NULL,
  `event_location` VARCHAR(255) DEFAULT NULL,
  `station_id` VARCHAR(15) NOT NULL,
  `status` ENUM('Pending','Approved','Rejected','Conditional') NOT NULL DEFAULT 'Pending',
  `officer_remarks` TEXT DEFAULT NULL,
  `id_type` VARCHAR(30) DEFAULT 'Aadhaar',
  `id_number` VARCHAR(50) DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`noc_id`),
  KEY `fk_noc_station` (`station_id`),
  CONSTRAINT `fk_noc_station` FOREIGN KEY (`station_id`) REFERENCES `police_stations` (`station_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: section144_orders (Curfew / Section 144 orders)
-- ============================================================
DROP TABLE IF EXISTS `section144_orders`;
CREATE TABLE `section144_orders` (
  `order_id` VARCHAR(30) NOT NULL,
  `district` VARCHAR(100) NOT NULL,
  `area_description` VARCHAR(300) NOT NULL,
  `pincode` VARCHAR(10) DEFAULT NULL,
  `reason` TEXT NOT NULL,
  `start_datetime` DATETIME NOT NULL,
  `end_datetime` DATETIME NOT NULL,
  `issued_by` VARCHAR(150) NOT NULL,
  `issued_by_rank` VARCHAR(50) NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: sos_alerts
-- ============================================================
DROP TABLE IF EXISTS `sos_alerts`;
CREATE TABLE `sos_alerts` (
  `alert_id` VARCHAR(30) NOT NULL,
  `user_id` VARCHAR(30) NOT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `user_phone` VARCHAR(15) NOT NULL,
  `latitude` DECIMAL(10,7) DEFAULT NULL,
  `longitude` DECIMAL(10,7) DEFAULT NULL,
  `location_description` VARCHAR(300) DEFAULT NULL,
  `nearest_station_id` VARCHAR(15) DEFAULT NULL,
  `beat_officer_name` VARCHAR(150) DEFAULT NULL,
  `beat_officer_phone` VARCHAR(15) DEFAULT NULL,
  `status` ENUM('Active','Responded','Closed') DEFAULT 'Active',
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`alert_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `beats`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `police_stations`;
DROP TABLE IF EXISTS `units`;
DROP TABLE IF EXISTS `ranges`;

DROP VIEW IF EXISTS `v_pending_firs`;
DROP VIEW IF EXISTS `v_district_crime_stats`;
DROP VIEW IF EXISTS `v_beat_workload`;
DROP VIEW IF EXISTS `v_station_summary`;
DROP VIEW IF EXISTS `v_all_complaints`;

-- ============================================================
-- TABLE DEFINITIONS
-- ============================================================

CREATE TABLE `ranges` (
  `range_id` VARCHAR(10) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `hq` VARCHAR(100) NOT NULL,
  `igp_name` VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`range_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `units` (
  `unit_id` VARCHAR(10) NOT NULL,
  `type` ENUM('commissionerate','district','isd','cid') NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `range_id` VARCHAR(10) NOT NULL,
  `hq` VARCHAR(100) NOT NULL,
  `head_name` VARCHAR(100) DEFAULT NULL,
  `head_rank` ENUM('CP','SP','DIG') DEFAULT NULL,
  PRIMARY KEY (`unit_id`),
  KEY `fk_unit_range` (`range_id`),
  CONSTRAINT `fk_unit_range` FOREIGN KEY (`range_id`) REFERENCES `ranges` (`range_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `police_stations` (
  `station_id` VARCHAR(10) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `jurisdiction_type` ENUM('commissionerate','district') NOT NULL,
  `parent_unit_id` VARCHAR(10) NOT NULL,
  `address` VARCHAR(300) NOT NULL,
  `taluk` VARCHAR(100) NOT NULL,
  `district` VARCHAR(100) NOT NULL,
  `pincode` VARCHAR(10) NOT NULL,
  `lat` DECIMAL(10,7) NOT NULL,
  `lng` DECIMAL(10,7) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `sho_name` VARCHAR(150) DEFAULT NULL,
  `sho_rank` ENUM('PI','PSI','ASI','CI') DEFAULT 'PI',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`station_id`),
  KEY `idx_district` (`district`),
  KEY `idx_pincode` (`pincode`),
  KEY `idx_lat_lng` (`lat`,`lng`),
  CONSTRAINT `fk_station_unit` FOREIGN KEY (`parent_unit_id`) REFERENCES `units` (`unit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `user_id` VARCHAR(20) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(200) NOT NULL UNIQUE,
  `phone` VARCHAR(15) DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
  `role` ENUM('citizen','police','admin') NOT NULL DEFAULT 'citizen',
  `station_id` VARCHAR(10) DEFAULT NULL,
  `unit_id` VARCHAR(10) DEFAULT NULL,
  `rank` ENUM('DGP','ADGP','IGP','DIG','CP','SP','DCP','ACP','DySP','CI','PI','PSI','ASI','HC','PC') DEFAULT NULL,
  `badge_no` VARCHAR(30) DEFAULT NULL,
  `photo` VARCHAR(300) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `beats` (
  `beat_id` VARCHAR(15) NOT NULL,
  `station_id` VARCHAR(10) NOT NULL,
  `beat_no` VARCHAR(10) NOT NULL,
  `area_name` VARCHAR(200) NOT NULL,
  `pincode` VARCHAR(10) NOT NULL,
  `assigned_officer_name` VARCHAR(150) DEFAULT NULL,
  `assigned_officer_rank` ENUM('PC','HC','ASI') DEFAULT 'PC',
  `assigned_officer_phone` VARCHAR(15) DEFAULT NULL,
  PRIMARY KEY (`beat_id`),
  KEY `fk_beat_station` (`station_id`),
  CONSTRAINT `fk_beat_station` FOREIGN KEY (`station_id`) REFERENCES `police_stations` (`station_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `firs` (
  `fir_id` VARCHAR(20) NOT NULL,
  `fir_number` VARCHAR(50) NOT NULL UNIQUE,
  `complainant_name` VARCHAR(200) NOT NULL,
  `complainant_phone` VARCHAR(15) NOT NULL,
  `complainant_email` VARCHAR(200) DEFAULT NULL,
  `complainant_address` TEXT NOT NULL,
  `id_type` VARCHAR(30) DEFAULT 'Aadhaar',
  `id_number` VARCHAR(20) DEFAULT NULL,
  `incident_date` DATE NOT NULL,
  `incident_time` TIME DEFAULT NULL,
  `incident_place` VARCHAR(300) NOT NULL,
  `incident_description` TEXT NOT NULL,
  `crime_category` ENUM('IPC','Cyber Crime','NDPS','POCSO','Crime Against Women','SC-ST Atrocities','Traffic','Other') NOT NULL,
  `sub_category` VARCHAR(200) NOT NULL,
  `suspect_details` TEXT DEFAULT NULL,
  `witness_details` TEXT DEFAULT NULL,
  `station_id` VARCHAR(10) NOT NULL,
  `assigned_officer_id` VARCHAR(20) DEFAULT NULL,
  `status` ENUM('Pending','Investigating','ChargeSheeted','Closed','Referred') DEFAULT 'Pending',
  `priority` ENUM('High','Medium','Low') DEFAULT 'Medium',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` VARCHAR(20) DEFAULT NULL,
  PRIMARY KEY (`fir_id`),
  KEY `idx_fir_status` (`status`),
  KEY `idx_fir_date` (`created_at`),
  KEY `idx_fir_station` (`station_id`),
  KEY `idx_fir_category` (`crime_category`),
  CONSTRAINT `fk_fir_station` FOREIGN KEY (`station_id`) REFERENCES `police_stations` (`station_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `criminals` (
  `criminal_id` VARCHAR(20) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `aliases` VARCHAR(300) DEFAULT NULL,
  `father_name` VARCHAR(150) DEFAULT NULL,
  `dob` DATE DEFAULT NULL,
  `photo` VARCHAR(300) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `station_id` VARCHAR(10) NOT NULL,
  `is_rowdy_sheeter` TINYINT(1) DEFAULT 0,
  `is_history_sheeter` TINYINT(1) DEFAULT 0,
  `goonda_act` TINYINT(1) DEFAULT 0,
  `kcoca` TINYINT(1) DEFAULT 0,
  `cases_count` INT DEFAULT 0,
  `last_known_location` VARCHAR(300) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`criminal_id`),
  KEY `fk_criminal_station` (`station_id`),
  CONSTRAINT `fk_criminal_station` FOREIGN KEY (`station_id`) REFERENCES `police_stations` (`station_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `missing_persons` (
  `missing_id` VARCHAR(20) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `age` INT NOT NULL,
  `gender` ENUM('Male','Female','Other') NOT NULL,
  `photo` VARCHAR(300) DEFAULT NULL,
  `last_seen_location` VARCHAR(300) NOT NULL,
  `date_missing` DATE NOT NULL,
  `description` TEXT NOT NULL,
  `contact_number` VARCHAR(15) NOT NULL,
  `status` ENUM('Open','Traced','Closed') DEFAULT 'Open',
  `station_id` VARCHAR(10) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`missing_id`),
  KEY `fk_missing_station` (`station_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `wanted_persons` (
  `wanted_id` VARCHAR(20) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `aliases` VARCHAR(200) DEFAULT NULL,
  `photo` VARCHAR(300) DEFAULT NULL,
  `crime_category` VARCHAR(100) NOT NULL,
  `last_known_location` VARCHAR(300) NOT NULL,
  `reward_amount` DECIMAL(10,2) DEFAULT 0,
  `fir_number` VARCHAR(50) NOT NULL,
  `station_id` VARCHAR(10) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`wanted_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `senior_citizens` (
  `citizen_id` VARCHAR(20) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `age` INT NOT NULL,
  `address` TEXT NOT NULL,
  `pincode` VARCHAR(10) NOT NULL,
  `phone` VARCHAR(15) NOT NULL,
  `local_contact_name` VARCHAR(150) DEFAULT NULL,
  `local_contact_phone` VARCHAR(15) DEFAULT NULL,
  `station_id` VARCHAR(10) NOT NULL,
  `beat_id` VARCHAR(15) DEFAULT NULL,
  `registered_date` DATE NOT NULL,
  `last_visit_date` DATE DEFAULT NULL,
  `medical_conditions` TEXT DEFAULT NULL,
  PRIMARY KEY (`citizen_id`),
  KEY `fk_sc_station` (`station_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tenant_verifications` (
  `verify_id` VARCHAR(20) NOT NULL,
  `landlord_name` VARCHAR(200) NOT NULL,
  `landlord_phone` VARCHAR(15) NOT NULL,
  `tenant_name` VARCHAR(200) NOT NULL,
  `tenant_phone` VARCHAR(15) NOT NULL,
  `tenant_address_permanent` TEXT NOT NULL,
  `rental_address` TEXT NOT NULL,
  `rental_from` DATE NOT NULL,
  `id_type` VARCHAR(30) NOT NULL,
  `id_number` VARCHAR(30) NOT NULL,
  `station_id` VARCHAR(10) NOT NULL,
  `status` ENUM('Pending','Verified','Rejected') DEFAULT 'Pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`verify_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `lost_articles` (
  `report_id` VARCHAR(20) NOT NULL,
  `report_number` VARCHAR(50) NOT NULL UNIQUE,
  `applicant_name` VARCHAR(200) NOT NULL,
  `applicant_phone` VARCHAR(15) NOT NULL,
  `applicant_address` TEXT NOT NULL,
  `article_type` ENUM('Mobile','Vehicle','Document','Wallet','Jewellery','Other') NOT NULL,
  `article_description` TEXT NOT NULL,
  `imei_number` VARCHAR(20) DEFAULT NULL,
  `vehicle_number` VARCHAR(20) DEFAULT NULL,
  `document_type` VARCHAR(100) DEFAULT NULL,
  `date_lost` DATE NOT NULL,
  `place_lost` VARCHAR(300) NOT NULL,
  `station_id` VARCHAR(10) NOT NULL,
  `status` ENUM('Reported','Found','Closed') DEFAULT 'Reported',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `event_permissions` (
  `perm_id` VARCHAR(20) NOT NULL,
  `applicant_name` VARCHAR(200) NOT NULL,
  `organization` VARCHAR(200) DEFAULT NULL,
  `phone` VARCHAR(15) NOT NULL,
  `event_type` ENUM('Cultural','Political','Religious','Sports','Procession','Dharna/Protest','Other') NOT NULL,
  `event_name` VARCHAR(300) NOT NULL,
  `expected_crowd` INT DEFAULT NULL,
  `event_date` DATE NOT NULL,
  `event_time` VARCHAR(30) NOT NULL,
  `venue` TEXT NOT NULL,
  `station_id` VARCHAR(10) NOT NULL,
  `status` ENUM('Pending','Approved','Rejected','Conditional') DEFAULT 'Pending',
  `conditions` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`perm_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `advisories` (
  `advisory_id` VARCHAR(20) NOT NULL,
  `title_en` VARCHAR(400) NOT NULL,
  `title_kn` VARCHAR(400) NOT NULL,
  `content_en` TEXT NOT NULL,
  `content_kn` TEXT NOT NULL,
  `type` ENUM('General','Section 144','Cyber') NOT NULL DEFAULT 'General',
  `district` VARCHAR(100) NOT NULL,
  `publish_date` DATE NOT NULL,
  `effective_date` DATE DEFAULT NULL,
  `duration_hours` INT DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`advisory_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `evidence` (
  `evidence_id` VARCHAR(20) NOT NULL,
  `fir_id` VARCHAR(20) NOT NULL,
  `evidence_type` ENUM('Physical','Digital','Documentary','Forensic','Witness Statement') NOT NULL,
  `description` TEXT NOT NULL,
  `collected_by` VARCHAR(200) NOT NULL,
  `collected_date` DATETIME NOT NULL,
  `storage_location` VARCHAR(300) DEFAULT NULL,
  `chain_of_custody` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`evidence_id`),
  KEY `fk_evidence_fir` (`fir_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `case_timeline` (
  `timeline_id` INT AUTO_INCREMENT NOT NULL,
  `fir_id` VARCHAR(20) NOT NULL,
  `action` VARCHAR(300) NOT NULL,
  `officer_name` VARCHAR(200) NOT NULL,
  `officer_rank` VARCHAR(20) NOT NULL,
  `action_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`timeline_id`),
  KEY `fk_timeline_fir` (`fir_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_log` (
  `log_id` INT AUTO_INCREMENT NOT NULL,
  `user_id` VARCHAR(20) NOT NULL,
  `user_role` ENUM('citizen','police','admin') NOT NULL,
  `action` VARCHAR(200) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(50) DEFAULT NULL,
  `old_values` TEXT DEFAULT NULL,
  `new_values` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATA
-- ============================================================

DELETE FROM `ranges`;
INSERT INTO `ranges` VALUES
('RNG01','Bengaluru Range','Bengaluru','IGP Bengaluru Range'),
('RNG02','Mysuru Range','Mysuru','IGP Mysuru Range'),
('RNG03','Belagavi Range','Belagavi','IGP Belagavi Range'),
('RNG04','Kalaburagi Range','Kalaburagi','IGP Kalaburagi Range'),
('RNG05','Eastern Range','Shivamogga','IGP Eastern Range'),
('RNG06','Western Range','Mangaluru','IGP Western Range'),
('RNG07','Central Range','Davanagere','IGP Central Range'),
('RNG08','Northern Range','Ballari','IGP Northern Range'),
('RNG09','Southern Range','Hassan','IGP Southern Range');

DELETE FROM `units`;
INSERT INTO `units` VALUES
-- 9 Commissionerates
('CMR01','commissionerate','Bengaluru City','RNG01','Bengaluru','CP Bengaluru City','CP'),
('CMR02','commissionerate','Mysuru City','RNG02','Mysuru','CP Mysuru City','CP'),
('CMR03','commissionerate','Mangaluru City','RNG06','Mangaluru','CP Mangaluru City','CP'),
('CMR04','commissionerate','Hubballi-Dharwad','RNG03','Hubballi','CP Hubballi-Dharwad','CP'),
('CMR05','commissionerate','Belagavi City','RNG03','Belagavi','CP Belagavi City','CP'),
('CMR06','commissionerate','Kalaburagi City','RNG04','Kalaburagi','CP Kalaburagi City','CP'),
('CMR07','commissionerate','Davanagere City','RNG07','Davanagere','CP Davanagere City','CP'),
('CMR08','commissionerate','Tumakuru City','RNG01','Tumakuru','CP Tumakuru City','CP'),
('CMR09','commissionerate','Shivamogga City','RNG05','Shivamogga','CP Shivamogga City','CP'),
-- 31 Districts
('DST01','district','Bagalkot','RNG03','Bagalkot','SP Bagalkot','SP'),
('DST02','district','Ballari','RNG08','Ballari','SP Ballari','SP'),
('DST03','district','Belagavi Rural','RNG03','Belagavi','SP Belagavi Rural','SP'),
('DST04','district','Bengaluru Rural','RNG01','Bengaluru Rural','SP Bengaluru Rural','SP'),
('DST05','district','Bidar','RNG04','Bidar','SP Bidar','SP'),
('DST06','district','Chamarajanagar','RNG09','Chamarajanagar','SP Chamarajanagar','SP'),
('DST07','district','Chikkaballapur','RNG01','Chikkaballapur','SP Chikkaballapur','SP'),
('DST08','district','Chikkamagaluru','RNG06','Chikkamagaluru','SP Chikkamagaluru','SP'),
('DST09','district','Chitradurga','RNG07','Chitradurga','SP Chitradurga','SP'),
('DST10','district','Dakshina Kannada','RNG06','Mangaluru','Dr. Bheemashankar S Guled','SP'),
('DST11','district','Davanagere Rural','RNG07','Davanagere','SP Davanagere Rural','SP'),
('DST12','district','Dharwad Rural','RNG03','Dharwad','SP Dharwad Rural','SP'),
('DST13','district','Gadag','RNG03','Gadag','SP Gadag','SP'),
('DST14','district','Hassan','RNG09','Hassan','SP Hassan','SP'),
('DST15','district','Haveri','RNG07','Haveri','SP Haveri','SP'),
('DST16','district','Kalaburagi Rural','RNG04','Kalaburagi','SP Kalaburagi Rural','SP'),
('DST17','district','Kodagu','RNG02','Madikeri','SP Kodagu','SP'),
('DST18','district','Kolar','RNG01','Kolar','SP Kolar','SP'),
('DST19','district','Koppal','RNG08','Koppal','SP Koppal','SP'),
('DST20','district','Mandya','RNG02','Mandya','SP Mandya','SP'),
('DST21','district','Mysuru Rural','RNG02','Mysuru','SP Mysuru Rural','SP'),
('DST22','district','Raichur','RNG08','Raichur','SP Raichur','SP'),
('DST23','district','Ramanagara','RNG01','Ramanagara','SP Ramanagara','SP'),
('DST24','district','Shivamogga Rural','RNG05','Shivamogga','SP Shivamogga Rural','SP'),
('DST25','district','Tumakuru Rural','RNG01','Tumakuru','SP Tumakuru Rural','SP'),
('DST26','district','Udupi','RNG06','Udupi','SP Udupi','SP'),
('DST27','district','Uttara Kannada','RNG06','Karwar','SP Uttara Kannada','SP'),
('DST28','district','Vijayanagara','RNG08','Hospet','SP Vijayanagara','SP'),
('DST29','district','Vijayapura','RNG03','Vijayapura','SP Vijayapura','SP'),
('DST30','district','Yadgir','RNG04','Yadgir','SP Yadgir','SP'),
('DST31','district','ISD','RNG01','Bengaluru','SP ISD','SP');

DELETE FROM `police_stations`;
INSERT INTO `police_stations` (`station_id`,`name`,`jurisdiction_type`,`parent_unit_id`,`address`,`taluk`,`district`,`pincode`,`lat`,`lng`,`phone`,`email`,`sho_name`,`sho_rank`,`created_at`) VALUES
('KL001','Kolar Town','district','DST18','SP Office Road, Kolar','Kolar','Kolar','563101',13.1357,78.1324,'08152-222805','kolartown@klrps.gov.in','PI on Duty','PI',NOW()),
('KL002','Kolar Gulpet','district','DST18','Gulpet, Kolar','Kolar','Kolar','563101',13.1380,78.1270,'08152-222024','gulpet@klrps.gov.in','PI on Duty','PI',NOW()),
('KL003','Kolar Gowripete','district','DST18','Gowripete, Kolar','Kolar','Kolar','563101',13.1340,78.1350,'08152-222616','gowripete@klrps.gov.in','PI on Duty','PI',NOW()),
('KL004','Kolar Noor Nagar','district','DST18','Noor Nagar, Kolar','Kolar','Kolar','563101',13.1410,78.1200,'08152-240596','noornagar@klrps.gov.in','PI on Duty','PI',NOW()),
('KL005','Malur','district','DST18','Maruthi Extension, Malur','Malur','Kolar','563130',13.0050,77.9370,'08151-222101','malur@klrps.gov.in','PI on Duty','PI',NOW()),
('KL006','Masti','district','DST18','Masti, Malur Taluk','Malur','Kolar','563130',13.0200,77.9600,'08151-245101','masti@klrps.gov.in','PI on Duty','PI',NOW()),
('KL007','Vemagal','district','DST18','Vemagal, Kolar Taluk','Kolar','Kolar','563128',13.0950,78.1700,'08152-246421','vemagal@klrps.gov.in','PI on Duty','PI',NOW()),
('KL008','Bangarpet Town','district','DST18','Tippu Nagar, Bangarpet','Bangarpet','Kolar','563114',12.9700,78.1900,'08153-255228','bangarpet@klrps.gov.in','PI on Duty','PI',NOW()),
('KL009','Kamasamudram','district','DST18','Kamasamudram, Bangarpet Taluk','Bangarpet','Kolar','563114',12.9900,78.2200,'08153-256101','kamasamudram@klrps.gov.in','PI on Duty','PI',NOW()),
('KL010','Bethamangala','district','DST18','Bethamangala, Bangarpet Taluk','Bangarpet','Kolar','563114',13.0300,78.2800,'08153-265101','bethamangala@klrps.gov.in','PI on Duty','PI',NOW()),
('KL011','KGF Robertsonpet','district','DST18','Robertsonpet, KGF','Bangarpet','Kolar','563122',12.9360,78.2650,'08153-274101','robertsonpet@klrps.gov.in','PI on Duty','PI',NOW()),
('KL012','KGF Oorgaum','district','DST18','Oorgaum, KGF','Bangarpet','Kolar','563122',12.9420,78.2580,'08153-274102','oorgaum@klrps.gov.in','PI on Duty','PI',NOW()),
('KL013','KGF Andersonpet','district','DST18','Andersonpet, KGF','Bangarpet','Kolar','563122',12.9500,78.2700,'08153-274103','andersonpet@klrps.gov.in','PI on Duty','PI',NOW()),
('KL014','KGF BEML Nagar','district','DST18','BEML Nagar, KGF','Bangarpet','Kolar','563122',12.9580,78.2800,'08153-274104','bemlnagar@klrps.gov.in','PI on Duty','PI',NOW()),
('KL015','KGF Champion Reef','district','DST18','Champion Reef, KGF','Bangarpet','Kolar','563122',12.9300,78.2550,'08153-274105','championreef@klrps.gov.in','PI on Duty','PI',NOW()),
('KL016','Mulbagal Town','district','DST18','KGF Road, Mulbagal','Mulbagal','Kolar','563131',13.1630,78.3960,'08159-225101','mulbagal@klrps.gov.in','PI on Duty','PI',NOW()),
('KL017','Marikuppam','district','DST18','Marikuppam, Mulbagal Taluk','Mulbagal','Kolar','563131',13.2000,78.3600,'08159-264101','marikuppam@klrps.gov.in','PI on Duty','PI',NOW()),
('KL018','Srinivasapura Town','district','DST18','Srinivasapura Town','Srinivasapura','Kolar','563135',13.3440,78.2170,'08157-246234','srinivasapura@klrps.gov.in','PI on Duty','PI',NOW()),
('KL019','Gownapalli','district','DST18','Gownapalli, Srinivasapura Taluk','Srinivasapura','Kolar','563135',13.3700,78.2400,'08157-255101','gownapalli@klrps.gov.in','PI on Duty','PI',NOW()),
('KL020','Rayalpad','district','DST18','Rayalpad, Mulbagal Taluk','Mulbagal','Kolar','563131',13.1900,78.4500,'08159-272101','rayalpad@klrps.gov.in','PI on Duty','PI',NOW()),
('KL021','Narsapura','district','DST18','Narsapura, Kolar Taluk','Kolar','Kolar','563133',13.2300,78.0900,'08152-285101','narsapura@klrps.gov.in','PI on Duty','PI',NOW()),
('KL022','Nangli','district','DST18','Nangli, Bangarpet Taluk','Bangarpet','Kolar','563114',12.9800,78.1600,'08153-262101','nangli@klrps.gov.in','PI on Duty','PI',NOW()),
('KL023','Kolar Women PS','district','DST18','SP Office Campus, Kolar','Kolar','Kolar','563101',13.1370,78.1310,'08152-222810','kolarwomen@klrps.gov.in','PI on Duty','PI',NOW()),
('CKB01','Chikkaballapur Town','district','DST07','Chikkaballapur Town','Chikkaballapur','Chikkaballapur','562101',13.4355,77.7315,'08156-272101','town@ckbps.gov.in','PI on Duty','PI',NOW()),
('CKB02','Gauribidanur','district','DST07','Gauribidanur, Chikkaballapur','Gauribidanur','Chikkaballapur','561208',13.6140,77.5180,'08154-252101','gauribidanur@ckbps.gov.in','PI on Duty','PI',NOW()),
('CKB03','Bagepalli','district','DST07','Bagepalli, Chikkaballapur','Bagepalli','Chikkaballapur','561207',13.7820,77.7890,'08156-285101','bagepalli@ckbps.gov.in','PI on Duty','PI',NOW()),
('CKB04','Sidlaghatta','district','DST07','Sidlaghatta, Chikkaballapur','Sidlaghatta','Chikkaballapur','562205',13.3890,77.8670,'08158-272101','sidlaghatta@ckbps.gov.in','PI on Duty','PI',NOW()),
('CKB05','Gudibande','district','DST07','Gudibande, Chikkaballapur','Gudibande','Chikkaballapur','561209',13.9030,77.7560,'08156-291101','gudibande@ckbps.gov.in','PI on Duty','PI',NOW()),
('TM001','Tumakuru Town','commissionerate','CMR08','Tumakuru Town','Tumakuru','Tumakuru','572101',13.3400,77.1000,'0816-2277554','town@tmkps.gov.in','PI on Duty','PI',NOW()),
('TM002','Tumakuru S.S.Puram','commissionerate','CMR08','S.S.Puram, Tumakuru','Tumakuru','Tumakuru','572101',13.3450,77.1020,'0816-2277555','sspuram@tmkps.gov.in','PI on Duty','PI',NOW()),
('TM003','Tiptur','district','DST25','Tiptur, Tumakuru District','Tiptur','Tumakuru','572201',13.2590,76.4790,'08134-252101','tiptur@tmkps.gov.in','PI on Duty','PI',NOW()),
('TM004','Kunigal','district','DST25','Kunigal, Tumakuru District','Kunigal','Tumakuru','572130',13.0240,77.0240,'08132-252101','kunigal@tmkps.gov.in','PI on Duty','PI',NOW()),
('TM005','Madhugiri','district','DST25','Madhugiri, Tumakuru','Madhugiri','Tumakuru','572132',13.6630,77.2050,'08131-252101','madhugiri@tmkps.gov.in','PI on Duty','PI',NOW()),
('TM006','Sira','district','DST25','Sira, Tumakuru District','Sira','Tumakuru','572137',13.7440,76.9060,'08138-252101','sira@tmkps.gov.in','PI on Duty','PI',NOW()),
('TM007','Pavagada','district','DST25','Pavagada, Tumakuru District','Pavagada','Tumakuru','561202',14.0960,77.2760,'08136-252101','pavagada@tmkps.gov.in','PI on Duty','PI',NOW()),
('TM008','Koratagere','district','DST25','Koratagere, Tumakuru','Koratagere','Tumakuru','572129',13.5230,77.2300,'08139-252101','koratagere@tmkps.gov.in','PI on Duty','PI',NOW()),
('TM009','Gubbi','district','DST25','Gubbi, Tumakuru District','Gubbi','Tumakuru','572216',13.3100,76.9450,'08133-252101','gubbi@tmkps.gov.in','PI on Duty','PI',NOW()),
('TM010','Turuvekere','district','DST25','Turuvekere, Tumakuru','Turuvekere','Tumakuru','572227',13.1640,76.6560,'08134-266101','turuvekere@tmkps.gov.in','PI on Duty','PI',NOW()),
('RN001','Ramanagara Town','district','DST23','Ramanagara Town','Ramanagara','Ramanagara','562159',12.7252,77.2807,'08027-272101','town@rmnps.gov.in','PI on Duty','PI',NOW()),
('RN002','Channapatna','district','DST23','Channapatna, Ramanagara','Channapatna','Ramanagara','562160',12.6510,77.2060,'08113-252101','channapatna@rmnps.gov.in','PI on Duty','PI',NOW()),
('RN003','Magadi','district','DST23','Magadi, Ramanagara District','Magadi','Ramanagara','562120',12.9580,77.2260,'08024-772101','magadi@rmnps.gov.in','PI on Duty','PI',NOW()),
('RN004','Kanakapura','district','DST23','Kanakapura, Ramanagara','Kanakapura','Ramanagara','562117',12.5480,77.4190,'08114-252101','kanakapura@rmnps.gov.in','PI on Duty','PI',NOW()),
('RN005','Bidadi','district','DST23','Bidadi, Ramanagara District','Ramanagara','Ramanagara','562109',12.7970,77.3870,'08027-255101','bidadi@rmnps.gov.in','PI on Duty','PI',NOW()),
('MN001','Mandya Town','district','DST20','Mandya Town','Mandya','Mandya','571401',12.5243,76.8953,'08232-230057','town@mndps.gov.in','PI on Duty','PI',NOW()),
('MN002','Maddur','district','DST20','Maddur, Mandya District','Maddur','Mandya','571428',12.5820,77.0440,'08233-260101','maddur@mndps.gov.in','PI on Duty','PI',NOW()),
('MN003','Malavalli','district','DST20','Malavalli, Mandya District','Malavalli','Mandya','571430',12.3900,77.0550,'08234-255101','malavalli@mndps.gov.in','PI on Duty','PI',NOW()),
('MN004','Srirangapatna','district','DST20','Srirangapatna, Mandya','Srirangapatna','Mandya','571438',12.4270,76.6970,'08236-252101','srirangapatna@mndps.gov.in','PI on Duty','PI',NOW()),
('MN005','Nagamangala','district','DST20','Nagamangala, Mandya District','Nagamangala','Mandya','571432',12.8200,76.7540,'08235-252101','nagamangala@mndps.gov.in','PI on Duty','PI',NOW()),
('MN006','Krishnarajpet','district','DST20','Krishnarajpet, Mandya','Krishnarajpet','Mandya','571426',12.6620,76.4880,'08231-252101','krishnarajpet@mndps.gov.in','PI on Duty','PI',NOW()),
('MN007','Pandavapura','district','DST20','Pandavapura, Mandya District','Pandavapura','Mandya','571434',12.4890,76.6680,'08236-262101','pandavapura@mndps.gov.in','PI on Duty','PI',NOW()),
('MY001','Mysuru Rural','district','DST21','SP Office, Mysuru Rural','Mysuru','Mysuru','570011',12.2950,76.6390,'0821-2480101','rural@mysrps.gov.in','PI on Duty','PI',NOW()),
('MY002','Hunsur','district','DST21','Hunsur, Mysuru District','Hunsur','Mysuru','571105',12.3020,76.2920,'08222-252101','hunsur@mysrps.gov.in','PI on Duty','PI',NOW()),
('MY003','Periyapatna','district','DST21','Periyapatna, Mysuru District','Periyapatna','Mysuru','571107',12.3280,76.0990,'08225-252101','periyapatna@mysrps.gov.in','PI on Duty','PI',NOW()),
('MY004','Nanjangud','district','DST21','Nanjangud, Mysuru District','Nanjangud','Mysuru','571301',12.1170,76.6850,'08221-222101','nanjangud@mysrps.gov.in','PI on Duty','PI',NOW()),
('MY005','T. Narasipur','district','DST21','T.Narasipur, Mysuru District','T. Narasipur','Mysuru','571124',12.2150,76.8940,'08227-252101','tnarasipur@mysrps.gov.in','PI on Duty','PI',NOW()),
('MY006','H.D. Kote','district','DST21','H.D.Kote, Mysuru District','H.D. Kote','Mysuru','571114',12.0200,76.3600,'08228-252101','hdkote@mysrps.gov.in','PI on Duty','PI',NOW()),
('CJ001','Chamarajanagar Town','district','DST06','Chamarajanagar Town','Chamarajanagar','Chamarajanagar','571313',11.9260,76.9402,'08226-222101','town@cjnps.gov.in','PI on Duty','PI',NOW()),
('CJ002','Kollegal','district','DST06','Kollegal, Chamarajanagar','Kollegal','Chamarajanagar','571440',12.1580,77.1050,'08224-252101','kollegal@cjnps.gov.in','PI on Duty','PI',NOW()),
('CJ003','Gundlupet','district','DST06','Gundlupet, Chamarajanagar','Gundlupet','Chamarajanagar','571111',11.8060,76.6900,'08229-252101','gundlupet@cjnps.gov.in','PI on Duty','PI',NOW()),
('CJ004','Yelandur','district','DST06','Yelandur, Chamarajanagar','Yelandur','Chamarajanagar','571441',12.0530,77.0330,'08224-264101','yelandur@cjnps.gov.in','PI on Duty','PI',NOW()),
('CJ005','Hanur','district','DST06','Hanur, Chamarajanagar District','Hanur','Chamarajanagar','571439',12.0710,77.2750,'08224-272101','hanur@cjnps.gov.in','PI on Duty','PI',NOW()),
('HS001','Hassan Town','district','DST14','Hassan Town','Hassan','Hassan','573201',13.0068,76.0996,'08172-267580','town@hsnps.gov.in','PI on Duty','PI',NOW()),
('HS002','Holenarasipur','district','DST14','Holenarasipur, Hassan District','Holenarasipur','Hassan','573211',12.7870,76.2420,'08175-252101','holenarasipur@hsnps.gov.in','PI on Duty','PI',NOW()),
('HS003','Belur','district','DST14','Belur, Hassan District','Belur','Hassan','573115',13.1630,75.8680,'08177-222101','belur@hsnps.gov.in','PI on Duty','PI',NOW()),
('HS004','Arsikere','district','DST14','Arsikere, Hassan District','Arsikere','Hassan','573103',13.3140,76.2590,'08174-252101','arsikere@hsnps.gov.in','PI on Duty','PI',NOW()),
('HS005','Channarayapatna','district','DST14','Channarayapatna, Hassan','Channarayapatna','Hassan','573116',12.9030,76.3880,'08176-252101','channarayapatna@hsnps.gov.in','PI on Duty','PI',NOW()),
('HS006','Sakleshpur','district','DST14','Sakleshpur, Hassan District','Sakleshpur','Hassan','573134',12.9440,75.7890,'08173-252101','sakleshpur@hsnps.gov.in','PI on Duty','PI',NOW()),
('HS007','Alur','district','DST14','Alur, Hassan District','Alur','Hassan','573218',13.1000,75.9200,'08177-242101','alur@hsnps.gov.in','PI on Duty','PI',NOW()),
('KG001','Madikeri Town','district','DST17','Madikeri Town, Kodagu','Madikeri','Kodagu','571201',12.4208,75.7397,'08272-228425','town@kdgps.gov.in','PI on Duty','PI',NOW()),
('KG002','Virajpet','district','DST17','Virajpet, Kodagu District','Virajpet','Kodagu','571218',12.1700,75.8050,'08274-252101','virajpet@kdgps.gov.in','PI on Duty','PI',NOW()),
('KG003','Somwarpet','district','DST17','Somwarpet, Kodagu District','Somwarpet','Kodagu','571236',12.5990,75.8490,'08276-252101','somwarpet@kdgps.gov.in','PI on Duty','PI',NOW()),
('KG004','Gonikoppal','district','DST17','Gonikoppal, Kodagu District','Virajpet','Kodagu','571213',12.1960,75.9450,'08274-262101','gonikoppal@kdgps.gov.in','PI on Duty','PI',NOW()),
('PS001','Cubbon Park','commissionerate','CMR01','Kasturba Road, Bengaluru','Bengaluru North','Bengaluru Urban','560001',12.9763,77.5929,'080-22864444','cubbonpark@bcp.gov.in','PI on Duty','PI',NOW()),
('PS002','Halasuru Gate','commissionerate','CMR01','Halasuru Gate, Bengaluru','Bengaluru North','Bengaluru Urban','560008',12.9812,77.6132,'080-25581111','halasurugate@bcp.gov.in','PI on Duty','PI',NOW()),
('PS003','Vidhana Soudha','commissionerate','CMR01','Dr. Ambedkar Road, Bengaluru','Bengaluru North','Bengaluru Urban','560001',12.9796,77.5907,'080-22865555','vidhanasoudha@bcp.gov.in','PI on Duty','PI',NOW()),
('PS004','Commercial Street','commissionerate','CMR01','Commercial Street, Bengaluru','Bengaluru North','Bengaluru Urban','560001',12.9823,77.6078,'080-25586666','commercialst@bcp.gov.in','PI on Duty','PI',NOW()),
('PS005','Shivajinagar','commissionerate','CMR01','Shivajinagar, Bengaluru','Bengaluru North','Bengaluru Urban','560051',12.9854,77.6071,'080-22867777','shivajinagar@bcp.gov.in','PI on Duty','PI',NOW()),
('PS006','Ulsoor','commissionerate','CMR01','Ulsoor, Bengaluru','Bengaluru East','Bengaluru Urban','560008',12.9815,77.6214,'080-25589999','ulsoor@bcp.gov.in','PI on Duty','PI',NOW()),
('PS007','Indiranagar','commissionerate','CMR01','CMH Road, Indiranagar, Bengaluru','Bengaluru East','Bengaluru Urban','560038',12.9718,77.6414,'080-25218888','indiranagar@bcp.gov.in','PI on Duty','PI',NOW()),
('PS008','HAL','commissionerate','CMR01','Old Airport Road, Bengaluru','Bengaluru East','Bengaluru Urban','560017',12.9619,77.6582,'080-25277777','hal@bcp.gov.in','PI on Duty','PI',NOW()),
('PS009','Whitefield','commissionerate','CMR01','Whitefield Main Road, Bengaluru','Bengaluru East','Bengaluru Urban','560066',12.9698,77.7499,'080-28459999','whitefield@bcp.gov.in','PI on Duty','PI',NOW()),
('PS010','Marathahalli','commissionerate','CMR01','Marathahalli Bridge, Bengaluru','Bengaluru East','Bengaluru Urban','560037',12.9560,77.7019,'080-28451111','marathahalli@bcp.gov.in','PI on Duty','PI',NOW()),
('PS011','KR Puram','commissionerate','CMR01','Old Madras Road, Bengaluru','Bengaluru East','Bengaluru Urban','560036',13.0061,77.6971,'080-25612222','krpuram@bcp.gov.in','PI on Duty','PI',NOW()),
('PS012','Mahadevapura','commissionerate','CMR01','Mahadevapura, Bengaluru','Bengaluru East','Bengaluru Urban','560048',12.9888,77.6896,'080-28512222','mahadevapura@bcp.gov.in','PI on Duty','PI',NOW()),
('PS013','Electronic City','commissionerate','CMR01','Electronic City Phase 1, Bengaluru','Bengaluru South','Bengaluru Urban','560100',12.8458,77.6604,'080-28532222','electroniccity@bcp.gov.in','PI on Duty','PI',NOW()),
('PS014','Madiwala','commissionerate','CMR01','Madiwala, Bengaluru','Bengaluru South','Bengaluru Urban','560068',12.9216,77.6203,'080-25502222','madiwala@bcp.gov.in','PI on Duty','PI',NOW()),
('PS015','Koramangala','commissionerate','CMR01','80 Feet Road, Koramangala, Bengaluru','Bengaluru South','Bengaluru Urban','560034',12.9279,77.6271,'080-25537777','koramangala@bcp.gov.in','PI on Duty','PI',NOW()),
('PS016','Adugodi','commissionerate','CMR01','Adugodi, Bengaluru','Bengaluru South','Bengaluru Urban','560030',12.9424,77.6063,'080-25512222','adugodi@bcp.gov.in','PI on Duty','PI',NOW()),
('PS017','Banashankari','commissionerate','CMR01','Banashankari 2nd Stage, Bengaluru','Bengaluru South','Bengaluru Urban','560070',12.9258,77.5838,'080-26712222','banashankari@bcp.gov.in','PI on Duty','PI',NOW()),
('PS018','Jayanagar','commissionerate','CMR01','Jayanagar 4th Block, Bengaluru','Bengaluru South','Bengaluru Urban','560011',12.9250,77.5938,'080-26632222','jayanagar@bcp.gov.in','PI on Duty','PI',NOW()),
('PS019','JP Nagar','commissionerate','CMR01','JP Nagar 2nd Phase, Bengaluru','Bengaluru South','Bengaluru Urban','560078',12.9076,77.5850,'080-26592222','jpnagar@bcp.gov.in','PI on Duty','PI',NOW()),
('PS020','Basavanagudi','commissionerate','CMR01','Basavanagudi, Bengaluru','Bengaluru South','Bengaluru Urban','560004',12.9422,77.5756,'080-26612222','basavanagudi@bcp.gov.in','PI on Duty','PI',NOW()),
('PS021','Hanumanthnagar','commissionerate','CMR01','Hanumanthnagar, Bengaluru','Bengaluru South','Bengaluru Urban','560019',12.9415,77.5561,'080-26652222','hanumanthnagar@bcp.gov.in','PI on Duty','PI',NOW()),
('PS022','Rajajinagar','commissionerate','CMR01','Rajajinagar, Bengaluru','Bengaluru West','Bengaluru Urban','560010',12.9916,77.5548,'080-23112222','rajajinagar@bcp.gov.in','PI on Duty','PI',NOW()),
('PS023','Yeshwanthpur','commissionerate','CMR01','Yeshwanthpur, Bengaluru','Bengaluru West','Bengaluru Urban','560022',13.0239,77.5403,'080-22972222','yeshwanthpur@bcp.gov.in','PI on Duty','PI',NOW()),
('PS024','Sadashivnagar','commissionerate','CMR01','Sadashivnagar, Bengaluru','Bengaluru West','Bengaluru Urban','560080',13.0067,77.5784,'080-23612222','sadashivnagar@bcp.gov.in','PI on Duty','PI',NOW()),
('PS025','Malleshwaram','commissionerate','CMR01','Malleshwaram, Bengaluru','Bengaluru West','Bengaluru Urban','560003',13.0093,77.5700,'080-23312222','malleshwaram@bcp.gov.in','PI on Duty','PI',NOW()),
('PS026','Devaraja','commissionerate','CMR02','Devaraja Mohalla, Mysuru','Mysuru','Mysuru','570001',12.3084,76.6526,'0821-2421111','devaraja@mcp.gov.in','PI on Duty','PI',NOW()),
('PS027','Lashkar','commissionerate','CMR02','Lashkar Mohalla, Mysuru','Mysuru','Mysuru','570001',12.3115,76.6501,'0821-2422222','lashkar@mcp.gov.in','PI on Duty','PI',NOW()),
('PS028','Nazarbad','commissionerate','CMR02','Nazarbad, Mysuru','Mysuru','Mysuru','570010',12.3024,76.6589,'0821-2423333','nazarbad@mcp.gov.in','PI on Duty','PI',NOW()),
('PS029','Krishnaraja','commissionerate','CMR02','Krishnaraja Mohalla, Mysuru','Mysuru','Mysuru','570004',12.3056,76.6555,'0821-2424444','krishnaraja@mcp.gov.in','PI on Duty','PI',NOW()),
('PS030','V.V. Puram','commissionerate','CMR02','V.V. Puram, Mysuru','Mysuru','Mysuru','570002',12.3136,76.6480,'0821-2425555','vvpuram@mcp.gov.in','PI on Duty','PI',NOW()),
('PS031','Kuvempunagar','commissionerate','CMR02','Kuvempunagar, Mysuru','Mysuru','Mysuru','570023',12.2934,76.6390,'0821-2426666','kuvempunagar@mcp.gov.in','PI on Duty','PI',NOW()),
('PS032','Jayalakshmipuram','commissionerate','CMR02','Jayalakshmipuram, Mysuru','Mysuru','Mysuru','570012',12.3189,76.6456,'0821-2427777','jayalakshmipuram@mcp.gov.in','PI on Duty','PI',NOW()),
('PS033','Vijayanagar Mysuru','commissionerate','CMR02','Vijayanagar, Mysuru','Mysuru','Mysuru','570017',12.3256,76.6321,'0821-2428888','vijayanagarmys@mcp.gov.in','PI on Duty','PI',NOW()),
('PS034','Mangaluru North','commissionerate','CMR03','Mangaluru North PS','Mangaluru','Dakshina Kannada','575001',12.8800,74.8500,'0824-2220801','mlrnorth@mngcp.gov.in','PI on Duty','PI',NOW()),
('PS035','Mangaluru South','commissionerate','CMR03','Mangaluru South PS','Mangaluru','Dakshina Kannada','575002',12.8600,74.8400,'0824-2220802','mlrsouth@mngcp.gov.in','PI on Duty','PI',NOW()),
('PS036','Pandeshwar','commissionerate','CMR03','Pandeshwar, Mangaluru','Mangaluru','Dakshina Kannada','575001',12.8700,74.8450,'0824-2220803','pandeshwar@mngcp.gov.in','PI on Duty','PI',NOW()),
('PS037','Bunder','commissionerate','CMR03','Bunder, Mangaluru','Mangaluru','Dakshina Kannada','575001',12.8750,74.8480,'0824-2220804','bunder@mngcp.gov.in','PI on Duty','PI',NOW()),
('PS038','Barke','commissionerate','CMR03','Barke, Mangaluru','Mangaluru','Dakshina Kannada','575004',12.8900,74.8550,'0824-2220805','barke@mngcp.gov.in','PI on Duty','PI',NOW()),
('PS039','Kavoor','commissionerate','CMR03','Kavoor, Mangaluru','Mangaluru','Dakshina Kannada','575015',12.9000,74.8600,'0824-2220806','kavoor@mngcp.gov.in','PI on Duty','PI',NOW()),
('PS040','Surathkal','commissionerate','CMR03','Surathkal, Mangaluru','Mangaluru','Dakshina Kannada','575014',13.0200,74.8000,'0824-2220807','surathkal@mngcp.gov.in','PI on Duty','PI',NOW()),
('PS041','Panambur','commissionerate','CMR03','Panambur, Mangaluru','Mangaluru','Dakshina Kannada','575010',12.9400,74.8200,'0824-2220808','panambur@mngcp.gov.in','PI on Duty','PI',NOW()),
('PS042','Ullal','commissionerate','CMR03','Ullal, Mangaluru','Mangaluru','Dakshina Kannada','575020',12.8200,74.8700,'0824-2220809','ullal@mngcp.gov.in','PI on Duty','PI',NOW()),
('PS064','Bantwal','district','DST10','Bantwal','Bantwal','Dakshina Kannada','574211',12.9000,75.0300,'08255-230101','bantwal@dkps.gov.in','PI on Duty','PI',NOW()),
('PS065','Puttur','district','DST10','Puttur','Puttur','Dakshina Kannada','574201',12.7600,75.2000,'08251-230101','puttur@dkps.gov.in','PI on Duty','PI',NOW()),
('PS066','Sullia','district','DST10','Sullia','Sullia','Dakshina Kannada','574327',12.5600,75.3800,'08257-230101','sullia@dkps.gov.in','PI on Duty','PI',NOW()),
('PS067','Belthangady','district','DST10','Belthangady','Belthangady','Dakshina Kannada','574214',13.0000,75.3000,'08256-230101','belthangady@dkps.gov.in','PI on Duty','PI',NOW()),
('PS068','Moodbidri','district','DST10','Moodbidri','Moodbidri','Dakshina Kannada','574227',13.0800,74.9900,'08258-236101','moodbidri@dkps.gov.in','PI on Duty','PI',NOW()),
('PS069','Vittla','district','DST10','Vittla','Bantwal','Dakshina Kannada','574243',12.8000,75.0600,'08255-272101','vittla@dkps.gov.in','PI on Duty','PI',NOW()),
('PS070','Uppinangady','district','DST10','Uppinangady','Puttur','Dakshina Kannada','574241',12.8500,75.2500,'08251-272101','uppinangady@dkps.gov.in','PI on Duty','PI',NOW()),
('PS056','Udupi Town','district','DST26','Udupi Town','Udupi','Udupi','576101',13.3409,74.7421,'0820-2521278','udupitown@udps.gov.in','PI on Duty','PI',NOW()),
('PS057','Malpe','district','DST26','Malpe','Udupi','Udupi','576108',13.3500,74.7000,'0820-2521279','malpe@udps.gov.in','PI on Duty','PI',NOW()),
('PS058','Manipal','district','DST26','Manipal','Udupi','Udupi','576104',13.3533,74.7833,'0820-2521280','manipal@udps.gov.in','PI on Duty','PI',NOW()),
('PS059','Kaup','district','DST26','Kaup','Udupi','Udupi','574106',13.2200,74.6900,'0820-2521281','kaup@udps.gov.in','PI on Duty','PI',NOW()),
('PS060','Karkala','district','DST26','Karkala','Karkala','Udupi','574104',13.2000,74.9900,'08258-238101','karkala@udps.gov.in','PI on Duty','PI',NOW()),
('PS061','Kundapura','district','DST26','Kundapura','Kundapura','Udupi','576201',13.6300,74.7000,'08254-230101','kundapura@udps.gov.in','PI on Duty','PI',NOW()),
('PS062','Brahmavar','district','DST26','Brahmavar','Udupi','Udupi','576213',13.4300,74.7500,'0820-2567101','brahmavar@udps.gov.in','PI on Duty','PI',NOW()),
('PS063','Hebri','district','DST26','Hebri','Kundapura','Udupi','576112',13.4500,74.8500,'08252-272101','hebri@udps.gov.in','PI on Duty','PI',NOW()),
('PS_DT01','Dandeli Town','district','DST27','Barchi Road, Dandeli','Dandeli','Uttara Kannada','581325',15.2574,74.6211,'08284-231100','dandelitown@ukpolice.gov.in','PI on Duty','PI',NOW()),
('PS_KW01','Karwar Town','district','DST27','M.G. Road, Karwar','Karwar','Uttara Kannada','581301',14.8126,74.1294,'08382-226333','karwartown@ukpolice.gov.in','PI on Duty','PI',NOW()),
('PS_SR01','Sirsi Town','district','DST27','Sirsi Town PS, Sirsi','Sirsi','Uttara Kannada','581401',14.6214,74.8381,'08384-220101','sirsitown@ukpolice.gov.in','PI on Duty','PI',NOW()),
('PS_HV01','Honnavar','district','DST27','Honnavar Town','Honnavar','Uttara Kannada','581334',14.2757,74.4440,'08387-220101','honnavar@ukpolice.gov.in','PI on Duty','PI',NOW()),
('PS_AN01','Ankola','district','DST27','Ankola Town','Ankola','Uttara Kannada','581314',14.6652,74.3029,'08388-230433','ankola@ukpolice.gov.in','PI on Duty','PI',NOW()),
('PS081','Shivamogga Town','commissionerate','CMR09','Shivamogga Town','Shivamogga','Shivamogga','577201',13.9299,75.5681,'08182-227273','town@smgcp.gov.in','PI on Duty','PI',NOW()),
('PS076','Davanagere Town','commissionerate','CMR07','Davanagere Town','Davanagere','Davanagere','577001',14.4644,75.9218,'08192-230501','town@dvgcp.gov.in','PI on Duty','PI',NOW()),
('PS086','Tumakuru Town','commissionerate','CMR08','Tumakuru Town','Tumakuru','Tumakuru','572101',13.3400,77.1000,'0816-2277554','town@tmkcp.gov.in','PI on Duty','PI',NOW()),
('PS090','Chikkamagaluru Town','district','DST08','Chikkamagaluru','Chikkamagaluru','Chikkamagaluru','577101',13.3180,75.7744,'08262-230101','town@cmgps.gov.in','PI on Duty','PI',NOW()),
('PS093','Ballari Town','district','DST02','Ballari Town','Ballari','Ballari','583101',15.1394,76.9214,'08392-277974','town@bllps.gov.in','PI on Duty','PI',NOW()),
('PS094','Vijayapura Town','district','DST29','Vijayapura Town','Vijayapura','Vijayapura','586101',16.8302,75.7100,'08352-265656','town@vjyps.gov.in','PI on Duty','PI',NOW()),
('PS095','Bidar Town','district','DST05','Bidar Town','Bidar','Bidar','585401',17.9104,77.5199,'08482-225179','town@bdrps.gov.in','PI on Duty','PI',NOW()),
('PS096','Raichur Town','district','DST22','Raichur Town','Raichur','Raichur','584101',16.2076,77.3463,'08532-226592','town@rcrps.gov.in','PI on Duty','PI',NOW()),
('PS097','Hospet Town','district','DST28','Hospet Town','Hospet','Vijayanagara','583201',15.2689,76.3909,'08394-220865','town@vjnps.gov.in','PI on Duty','PI',NOW()),
('PS099','Mandya Town','district','DST20','Mandya Town','Mandya','Mandya','571401',12.5243,76.8953,'08232-230057','town@mndps.gov.in','PI on Duty','PI',NOW()),
('PS100','Chitradurga Town','district','DST09','Chitradurga Town','Chitradurga','Chitradurga','577501',14.2302,76.4009,'08194-222774','town@ctdrps.gov.in','PI on Duty','PI',NOW()),
('PS043','Hubballi Old Town','commissionerate','CMR04','Old Hubballi','Hubballi','Dharwad','580024',15.3500,75.1300,'0836-2233540','oldtown@hdcp.gov.in','PI on Duty','PI',NOW()),
('PS044','Dharwad Town','commissionerate','CMR04','Dharwad Town','Dharwad','Dharwad','580001',15.4600,75.0000,'0836-2233545','dharwadtown@hdcp.gov.in','PI on Duty','PI',NOW()),
('PS049','Khade Bazar','commissionerate','CMR05','Khade Bazar, Belagavi','Belagavi','Belagavi','590002',15.8600,74.5700,'0831-2405201','khadebazar@blgcp.gov.in','PI on Duty','PI',NOW()),
('PS052','Camp Belagavi','commissionerate','CMR05','Camp Area, Belagavi','Belagavi','Belagavi','590001',15.8400,74.5900,'0831-2405204','camp@blgcp.gov.in','PI on Duty','PI',NOW()),
('PS071','Kalaburagi Central','commissionerate','CMR06','Supermarket, Kalaburagi','Kalaburagi','Kalaburagi','585101',17.3297,76.8343,'08472-263645','central@klbcp.gov.in','PI on Duty','PI',NOW());

DELETE FROM `users`;
INSERT INTO `users` VALUES
('USR001','Kiran M.','kiran@citizen.in','9876543210','$2y$12$Citizen123HashPlaceholder1','citizen',NULL,NULL,NULL,NULL,NULL,1,NOW()),
('USR002','Anitha Pinto','anitha@citizen.in','8765432109','$2y$12$Citizen123HashPlaceholder2','citizen',NULL,NULL,NULL,NULL,NULL,1,NOW()),
('USR_DAN','Rajesh Dandeli','rajesh@citizen.in','9480081325','$2y$12$Citizen123HashPlaceholder3','citizen',NULL,NULL,NULL,NULL,NULL,1,NOW()),
('USR003','Rajan Kumar Shetty','sho.cubbonpark@ksp.gov.in','9480801301','$2y$12$Police123HashPlaceholder001','police','PS001',NULL,'PI','KSP-PI-4821','/images/officer-male-1.jpg',1,NOW()),
('USR004','Pooja S. Rao','sho.mlrnorth@ksp.gov.in','9480801302','$2y$12$Police123HashPlaceholder002','police','PS034',NULL,'PI','KSP-PI-5823','/images/officer-female-1.jpg',1,NOW()),
('USR_SHO_DT','Suresh Naik','sho.dandeli@ksp.gov.in','9480081001','$2y$12$Police123HashPlaceholder003','police','PS_DT01',NULL,'PI','KSP-PI-8284',NULL,1,NOW()),
('USR005','Dr. M.A. Saleem','cp.bengaluru@ksp.gov.in','9480801303','$2y$12$Commissioner123HashPlch001','admin',NULL,'CMR01','CP','KSP-CP-0001',NULL,1,NOW()),
('USR006','Dr. Bheemashankar S Guled','sp.dk@ksp.gov.in','9480801304','$2y$12$SP123HashPlaceholder0000001','admin',NULL,'DST10','SP','KSP-SP-0004',NULL,1,NOW()),
('USR_SP_UK','Raghavendra Aurad','sp.uk@ksp.gov.in','9480827001','$2y$12$SP123HashPlaceholder0000002','admin',NULL,'DST27','SP','KSP-SP-0027',NULL,1,NOW());

DELETE FROM `beats`;
INSERT INTO `beats` VALUES
-- Dandeli Town beats (most important for demo)
('BT_DT_01','PS_DT01','DT-01','West Paper Mill Colony, Dandeli','581325','PC Mahesh Nayak','PC','9480001001'),
('BT_DT_02','PS_DT01','DT-02','East Colony, Dandeli','581325','PC Suresh Bhat','PC','9480001002'),
('BT_DT_03','PS_DT01','DT-03','Barchi Road & Market Area, Dandeli','581325','PC Ramesh Naik','PC','9480001003'),
('BT_DT_04','PS_DT01','DT-04','Kali Nagar, Dandeli','581325','HC Venkat Shetty','HC','9480001004'),
('BT_DT_05','PS_DT01','DT-05','Industrial Area, Dandeli','581325','PC Girish Hegde','PC','9480001005'),
('BT_DT_06','PS_DT01','DT-06','Jungle Camp Area, Dandeli','581325','PC Anand Naik','PC','9480001006'),
-- Dandeli Rural beats
('BT_DR_01','PS_DT01','DR-01','Ambikanagar & Surrounding, Dandeli','581325','PC Pradeep Nayak','PC','9480002001'),
('BT_DR_02','PS_DT01','DR-02','Kulgi Nature Camp Area, Dandeli Rural','581325','PC Santosh Hegde','PC','9480002002'),
-- Cubbon Park beats
('BT_CP_01','PS001','CP-01','Kasturba Road & MG Road Area','560001','PC Ravi Kumar','PC','9880001001'),
('BT_CP_02','PS001','CP-02','Cubbon Park & High Court Area','560001','PC Suresh Reddy','PC','9880001002'),
-- Karwar Town beats
('BT_KW_01','PS_KW01','KW-01','MG Road & Harbor Area, Karwar','581301','PC Prakash Naik','PC','9480003001'),
('BT_KW_02','PS_KW01','KW-02','Sadashivgad Area, Karwar','581301','PC Rajan Shetty','PC','9480003002');

DELETE FROM `firs`;
INSERT INTO `firs` VALUES
('FIR_DAN001','KAR/2026/UK/DAN/000001','Manjunath Hegde','9480001234',NULL,'West Colony, Dandeli 581325','Aadhaar','1234-5678-9011','2026-05-10','14:30','Barchi Road, Dandeli Market','Mobile phone worth Rs. 18,000 snatched while walking near market. Two youth on motorcycle grabbed the phone and fled towards the forest road.','IPC','Theft (Section 379)','Two youth on black Bajaj Pulsar, KA-65-AB-1234','Auto driver at junction witnessed','PS_DT01',NULL,'Investigating','Medium',NOW(),NOW(),'USR_DAN'),
('FIR_DAN002','KAR/2026/UK/DAN/000002','Savitri Naik','9480005678',NULL,'East Colony, Dandeli','Aadhaar','9876-5432-1098','2026-05-08','20:00','East Colony, Dandeli','Domestic violence complaint. Husband under influence of alcohol assaulted wife causing injuries to head and shoulders.','Crime Against Women','Domestic Violence (Section 498A)','Husband Lokesh Naik, works in paper mill','Neighbour witnessed and heard screaming','PS_DT01',NULL,'Investigating','High',NOW(),NOW(),'USR_DAN'),
('FIR_DAN003','KAR/2026/UK/DAN/000003','Police (Suo Motu)','100',NULL,'Dandeli Town PS, Dandeli','Service','0','2026-05-05','11:00','Industrial Area, Dandeli','NDPS seizure. During vehicle checking, 500g of ganja was found in a two-wheeler near the industrial area. One person arrested.','NDPS','Possession & Sale (Section 20)','One male, age 24, resident of Dandeli','Two constables witnessed','PS_DT01',NULL,'ChargeSheeted','High',NOW(),NOW(),NULL),
('FIR_DAN004','KAR/2026/UK/DAN/000004','Ramesh Gowda','9480009012',NULL,'Jungle Camp Area, Dandeli','Aadhaar','1111-2222-3333','2026-04-30','09:00','Jungle Camp Area, Dandeli','Cattle theft. Two cows and one calf stolen from farm near jungle camp area overnight.','IPC','Cattle Theft (Section 378)','Unknown, possibly familiar with area','Farmhand noticed missing animals at dawn','PS_DT01',NULL,'Investigating','Medium',NOW(),NOW(),NULL),
('FIR001','KAR/2026/BNG/CP/004217','Ravi Shankar','9876543210',NULL,'No. 42, 1st Main, Jayanagar 4th Block, Bengaluru','Aadhaar','1122-3344-5566','2026-01-15','14:30','Jayanagar 4th Block, Bengaluru','Chain snatching by two persons on motorcycle. Gold chain weighing 3.5 sovereigns snatched while walking on the street. Accused fled towards South End Circle.','IPC','Theft (Section 379)','Two males, aged 25-30, black helmets, black Pulsar KA-05-XY-1234','Auto driver at junction witnessed','PS018',NULL,'Investigating','High',NOW(),NOW(),'USR001'),
('FIR002','KAR/2026/BNG/CP/004218','Lakshmi Narayan','9876543211',NULL,'No. 15, Indiranagar 1st Stage, Bengaluru','Aadhaar','2233-4455-6677','2026-01-14','22:45','Indiranagar CMH Road, Bengaluru','House break-in and theft. Unknown persons broke into the house and stole jewellery worth Rs. 8 lakhs, cash Rs. 50,000.','IPC','House Break-in (Section 380)','Unknown, prior knowledge of house layout','Neighbour noticed suspicious movement around 11 PM','PS007',NULL,'Investigating','High',NOW(),NOW(),NULL),
('FIR003','KAR/2026/BNG/CP/004219','Priya Sharma','9876543212',NULL,'Flat 302, Sunrise Apartments, Whitefield, Bengaluru','Aadhaar','3344-5566-7788','2026-01-12','10:15','Whitefield Main Road, Bengaluru','Online job fraud. Received WhatsApp message offering part-time job. Paid Rs. 25,000 as registration fee. After payment, sender blocked.','Cyber Crime','Online Fraud (IT Act 66C/66D)','Phone: +91-98765-99999, UPI ID: fraud@paytm','None','PS009',NULL,'Investigating','Medium',NOW(),NOW(),'USR001'),
('FIR004','KAR/2026/MNG/CP/000856','Anitha Pinto','7654321098',NULL,'Flat 4B, Ocean View Apartments, Mangaluru','Aadhaar','5566-7788-9900','2026-01-13','11:00','Hampankatta, Mangaluru','Gold chain snatching by helmet-wearing duo on motorcycle. Chain weighing 4 sovereigns snatched.','IPC','Theft (Section 379)','Two males on Yamaha R15, black helmets','Shopkeepers witnessed','PS034',NULL,'Investigating','High',NOW(),NOW(),'USR002'),
('FIR005','KAR/2026/UK/KW/000321','Kishore Naik','9480821001',NULL,'Sadashivgad, Karwar, UK','Aadhaar','6677-8899-0011','2026-01-20','18:00','Karwar Bus Stand Area','Wallet snatching at bus stand. Rs. 5,000 cash and Aadhaar card stolen.','IPC','Theft (Section 379)','Unknown youth, about 18-20 years','Co-passenger witnessed','PS_KW01',NULL,'Investigating','Low',NOW(),NOW(),NULL),
('FIR006','KAR/2026/UDI/PS/000432','Ganesh Bhat','6543210987',NULL,'No. 8, Car Street, Udupi','Aadhaar','7788-9900-1122','2026-01-15','06:00','Car Street, Udupi','Temple donation box theft. Unknown persons broke open the hundi and stole cash estimated at Rs. 45,000.','IPC','Theft (Section 380)','Professional thieves, unclear CCTV','Temple priest discovered in morning','PS056',NULL,'Investigating','Medium',NOW(),NOW(),NULL),
('FIR_KL001','KAR/2026/KLR/PS/000001','Mahesh Reddy','9880001357',NULL,'Gowripete, Kolar 563101','Aadhaar','1234-5678-9000','2026-05-20','15:30','Gowripete Market, Kolar','Mobile phone snatched near Gowripete market. Two persons on bike grabbed phone and fled towards KGF road.','IPC','Theft (Section 379)','Two youth on red Pulsar, KA-07-AB-9876','Shop owner witnessed','KL001',NULL,'Pending','Medium',NOW(),NOW(),'USR_KLR'),
('FIR_KL002','KAR/2026/KLR/PS/000002','Kavitha R.','9880002468',NULL,'Noor Nagar, Kolar 563101','Aadhaar','9876-5432-1000','2026-05-18','21:00','Noor Nagar, Kolar','Domestic violence. Husband assaulted wife. Neighbours called police.','Crime Against Women','Domestic Violence (Section 498A)','Husband Ramu R., resident of Noor Nagar','Neighbour Shivamma witnessed','KL001',NULL,'Investigating','High',NOW(),NOW(),NULL),
('FIR_KL003','KAR/2026/KLR/PS/000003','Raju KGF','9880003579',NULL,'Robertsonpet, KGF 563122','Aadhaar','1111-2222-3333','2026-05-15','10:00','Robertsonpet, KGF','UPI fraud. Lost Rs. 45,000 to fake customer care call claiming to be from SBI.','Cyber Crime','UPI / Banking Fraud','Unknown, phone: 9999888777','None','KL011',NULL,'Investigating','Medium',NOW(),NOW(),NULL),
('FIR_KL004','KAR/2026/KLR/PS/000004','Srinivas M.','9880004680',NULL,'Mulbagal Town 563131','Aadhaar','4444-5555-6666','2026-05-12','08:00','Mulbagal Bus Stand','Wallet theft at bus stand. Cash Rs. 8,000 and PAN card missing.','IPC','Theft (Section 379)','Unknown','Fellow passenger witnessed','KL016',NULL,'Pending','Low',NOW(),NOW(),NULL),
('FIR_KL005','KAR/2026/KLR/PS/000005','Lakshmi S.','9880005791',NULL,'Bangarpet Town 563114','Aadhaar','7777-8888-9999','2026-05-10','14:00','Bangarpet Main Road','Gold chain snatching. Chain worth Rs. 1.2 lakh snatched by helmet-wearing person on bike.','IPC','Theft (Section 379)','Male, helmet, black bike KA-07-XY-0000','Two witnesses at scene','KL008',NULL,'Investigating','High',NOW(),NOW(),NULL);

DELETE FROM `criminals`;
INSERT INTO `criminals` VALUES
('CRM_DAN001','Raju Nayak','Raju','Shivu Nayak','1990-03-15',NULL,'Near Old Bridge, Dandeli','PS_DT01',1,1,0,0,7,'Dandeli Town',NOW()),
('CRM_DAN002','Sunder Hegde','Sundar','Krishna Hegde','1985-07-22',NULL,'Industrial Area, Dandeli','PS_DT01',1,0,0,0,4,'Dandeli Area',NOW()),
('CRM001','Shiva @ Kali','Kali Shiva, Kali','Ramappa','1988-04-12','/images/wanted-1.jpg','Rajajinagar, Bengaluru','PS022',1,1,1,0,12,'Bengaluru','2026-01-01'),
('CRM002','Govinda Raju','Govinda','Manjunath Raju','1991-09-05','/images/wanted-2.jpg','Jayanagar, Bengaluru','PS018',1,1,0,0,8,'Bengaluru','2026-01-01'),
('CRM003','Lateef @ Tiger','Tiger Lateef','Abdul Lateef','1980-11-30',NULL,'Bunder, Mangaluru','PS037',1,1,1,1,15,'Mangaluru','2026-01-01'),
('CRM004','Ravi Shetty','Ravi','Suresh Shetty','1993-02-18',NULL,'Surathkal, DK','PS040',1,0,0,0,3,'Mangaluru','2026-01-01');

DELETE FROM `missing_persons`;
INSERT INTO `missing_persons` VALUES
('MSP_DAN001','Lakshmi Hegde',68,'Female','/images/missing-1.jpg','Near Kali River, Dandeli','2026-05-15','Elder woman, height 5.2ft, grey hair, wearing blue saree. Has memory issues. Last seen near river area at morning.','9480001100','Open','PS_DT01',NOW()),
('MSP001','Ravi Kumar',45,'Male','/images/missing-1.jpg','Jayanagar, Bengaluru','2026-01-10','Male, height 5.8ft, medium build. Wearing blue shirt and black trousers. Has diabetes.','9876543290','Open','PS018',NOW()),
('MSP002','Kavitha',32,'Female','/images/missing-2.jpg','Whitefield, Bengaluru','2026-01-08','Female, height 5.4ft, slim build, long hair. Last seen near Whitefield bus stop.','9876543291','Open','PS009',NOW()),
('MSP003','Nirmala Devi',55,'Female','/images/missing-1.jpg','Mangaluru North, DK','2025-12-28','Female, age 55, stout build. Has mental illness. Wearing white-green saree.','8765432190','Traced','PS034',NOW());

DELETE FROM `wanted_persons`;
INSERT INTO `wanted_persons` VALUES
('WNT001','Shiva @ Kali','Kali','/images/wanted-1.jpg','IPC - Murder','Bengaluru North',100000,'KAR/2026/BNG/CP/003100','PS022',NOW()),
('WNT002','Unknown Cyber Fraudster',NULL,'/images/wanted-2.jpg','Cyber Crime - UPI Fraud','Unknown Location',50000,'KAR/2026/BNG/CP/004219','PS009',NOW()),
('WNT_DAN001','Raju Nayak','Raju',NULL,'NDPS - Drug Trafficking','Dandeli/Sirsi Area',25000,'KAR/2026/UK/DAN/000003','PS_DT01',NOW());

DELETE FROM `senior_citizens`;
INSERT INTO `senior_citizens` VALUES
('SC_DAN001','Krishnappa Hegde',74,'West Colony, Dandeli 581325','581325','9480001234','Ramesh Hegde (son)','9480001235','PS_DT01','BT_DT_01','2025-06-01','2026-05-10','Hypertension, Diabetes'),
('SC_DAN002','Saraswathi Bai',68,'Barchi Road, Dandeli 581325','581325','9480002345','Sita (daughter)','9480002346','PS_DT01','BT_DT_03','2025-08-15','2026-04-25','Arthritis'),
('SC001','Ramaiah',78,'No. 42, Jayanagar, Bengaluru','560011','9876540001','Son Suresh','9876540002','PS018','BT_CP_01','2025-05-01','2026-04-20','Heart condition'),
('SC002','Shakuntala Devi',72,'Indiranagar, Bengaluru','560038','9876540003','Daughter Priya','9876540004','PS007',NULL,'2025-06-01','2026-04-15','Diabetes');

DELETE FROM `advisories`;
INSERT INTO `advisories` VALUES
('ADV001','Cyber Safety Advisory — Beware of UPI Fraud','ಸೈಬರ್ ಸುರಕ್ಷತಾ ಸಲಹೆ — UPI ವಂಚನೆಯ ಬಗ್ಗೆ ಎಚ್ಚರ','Citizens are advised to not share OTP, UPI PIN, or bank details on phone. Fraudsters posing as bank officials are active in Karnataka.','ಯಾವುದೇ ಅಪರಿಚಿತ ವ್ಯಕ್ತಿಗೆ OTP, UPI PIN ಅಥವಾ ಬ್ಯಾಂಕ್ ಮಾಹಿತಿ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.','Cyber','All Karnataka','2026-05-01',NULL,NULL,1),
('ADV002','Section 144 — Uttara Kannada District (Public Gathering Restriction)','ಸೆಕ್ಷನ್ 144 — ಉತ್ತರ ಕನ್ನಡ ಜಿಲ್ಲೆ (ಸಾರ್ವಜನಿಕ ಸಭೆ ನಿಷೇಧ)','Section 144 CrPC is in force in Karwar town limits from 20-May-2026 to 22-May-2026. Public gatherings of more than 5 persons are prohibited.','ಕಾರ್ವಾರ ಪಟ್ಟಣ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ದಿನಾಂಕ 20-05-2026 ರಿಂದ 22-05-2026 ವರೆಗೆ ಕ.ದ.ಸಂ. ಸೆಕ್ಷನ್ 144 ಜಾರಿಯಲ್ಲಿದೆ.','Section 144','Uttara Kannada','2026-05-19','2026-05-20',48,1),
('ADV003','Anti-Drug Drive — Helpline 14410','ಮಾದಕ ವ್ಯಸನ ವಿರೋಧಿ ಅಭಿಯಾನ — ಸಹಾಯವಾಣಿ 14410','Karnataka Police is intensifying anti-drug operations across districts. Report drug peddling to 14410 (Anti-Drug Helpline).','ಕರ್ನಾಟಕ ಪೊಲೀಸ್ ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳಲ್ಲಿ ಮಾದಕ ವ್ಯಸನ ವಿರೋಧಿ ಕಾರ್ಯಾಚರಣೆ ತೀವ್ರಗೊಳಿಸಿದೆ. 14410 ಕ್ಕೆ ಕರೆ ಮಾಡಿ ದೂರು ನೀಡಿ.','General','All Karnataka','2026-05-10',NULL,NULL,1);

DELETE FROM `evidence`;
INSERT INTO `evidence` VALUES
('EVD001','FIR_DAN001','Physical','Mobile phone IMEI 123456789012345 in zip-lock bag','PC Ramesh Naik, Dandeli Town PS',NOW(),'Evidence Room DT-01','Collected by PC Ramesh → PSI Prakash → Evidence Room',NOW()),
('EVD002','FIR001','Physical','CCTV footage from Jayanagar 4th Block junction (USB drive sealed in envelope)','PI Jayanagar',NOW(),'Evidence Room Jayanagar PS','Collected by PI Jayanagar',NOW());

-- ============================================================
-- VIEWS (5 views for DBMS coursework)
-- ============================================================

CREATE OR REPLACE VIEW `v_pending_firs` AS
SELECT f.fir_id, f.fir_number, f.complainant_name, f.complainant_phone,
  f.crime_category, f.sub_category, f.incident_date, f.incident_place,
  f.status, f.priority, f.created_at,
  COALESCE(ps.name, 'Unknown Station') AS station_name,
  COALESCE(ps.district, 'Unknown') AS district
FROM firs f LEFT JOIN police_stations ps ON f.station_id = ps.station_id
WHERE f.status = 'Pending'
ORDER BY f.created_at DESC;

CREATE OR REPLACE VIEW `v_district_crime_stats` AS
SELECT COALESCE(ps.district, 'Unknown') AS district, f.crime_category,
  COUNT(*) AS total,
  SUM(CASE WHEN f.status='Pending'       THEN 1 ELSE 0 END) AS pending,
  SUM(CASE WHEN f.status='Investigating' THEN 1 ELSE 0 END) AS investigating,
  SUM(CASE WHEN f.status='ChargeSheeted' THEN 1 ELSE 0 END) AS charge_sheeted,
  SUM(CASE WHEN f.status='Closed'        THEN 1 ELSE 0 END) AS closed
FROM firs f LEFT JOIN police_stations ps ON f.station_id = ps.station_id
GROUP BY COALESCE(ps.district,'Unknown'), f.crime_category ORDER BY total DESC;

CREATE OR REPLACE VIEW `v_beat_workload` AS
SELECT b.beat_id, b.beat_no, b.area_name, b.station_id, b.pincode,
  b.assigned_officer_name, b.assigned_officer_rank, b.assigned_officer_phone,
  COALESCE(ps.name,'Unknown') AS station_name, COALESCE(ps.district,'Unknown') AS district,
  (SELECT COUNT(*) FROM senior_citizens sc WHERE sc.beat_id = b.beat_id) AS senior_citizen_count
FROM beats b LEFT JOIN police_stations ps ON b.station_id = ps.station_id;

CREATE OR REPLACE VIEW `v_station_summary` AS
SELECT ps.station_id, ps.name, ps.district, ps.phone, ps.sho_name,
  COUNT(DISTINCT f.fir_id) AS total_firs,
  SUM(CASE WHEN f.status='Pending'       THEN 1 ELSE 0 END) AS pending_firs,
  SUM(CASE WHEN f.status='Investigating' THEN 1 ELSE 0 END) AS active_firs,
  SUM(CASE WHEN f.status='ChargeSheeted' THEN 1 ELSE 0 END) AS charged_firs,
  (SELECT COUNT(*) FROM criminals c WHERE c.station_id=ps.station_id AND c.is_rowdy_sheeter=1) AS rowdy_sheeters,
  (SELECT COUNT(*) FROM senior_citizens sc WHERE sc.station_id=ps.station_id) AS registered_seniors,
  (SELECT COUNT(*) FROM lost_articles la WHERE la.station_id=ps.station_id) AS elost_reports,
  (SELECT COUNT(*) FROM missing_persons mp WHERE mp.station_id=ps.station_id) AS missing_reports
FROM police_stations ps LEFT JOIN firs f ON ps.station_id=f.station_id
GROUP BY ps.station_id ORDER BY total_firs DESC;

CREATE OR REPLACE VIEW `v_all_complaints` AS
SELECT fir_id AS id, fir_number AS ref_number, complainant_name, complainant_phone,
  crime_category, sub_category AS details, incident_date, incident_place,
  status, station_id, created_at, 'FIR' AS type
FROM firs
UNION ALL
SELECT report_id, report_number, applicant_name, applicant_phone,
  article_type, article_description, date_lost, place_lost, status,
  station_id, created_at, 'e-Lost' AS type
FROM lost_articles
UNION ALL
SELECT verify_id, verify_id, landlord_name, landlord_phone,
  'Tenant Verification', tenant_name, rental_from, rental_address,
  status, station_id, created_at, 'Tenant Verification' AS type
FROM tenant_verifications
UNION ALL
SELECT missing_id, missing_id, name, contact_number,
  'Missing Person', description, date_missing, last_seen_location,
  status, station_id, created_at, 'Missing Person' AS type
FROM missing_persons
UNION ALL
SELECT perm_id, perm_id, applicant_name, phone,
  event_type, event_name, event_date, venue, status,
  station_id, created_at, 'Event Permission' AS type
FROM event_permissions;

-- ============================================================
-- SEED DATA: tenant_verifications (3 sample verifications)
-- ============================================================
DELETE FROM `tenant_verifications`;
INSERT INTO `tenant_verifications` (`verify_id`,`landlord_name`,`landlord_phone`,`tenant_name`,`tenant_phone`,`tenant_address_permanent`,`rental_address`,`rental_from`,`id_type`,`id_number`,`station_id`,`status`,`created_at`) VALUES
('TV_001','Ramesh Gowda','9880011001','Suresh Kumar M.','9880022001','14 Gandhi Nagar, Mysuru 570001','Plot 45, 3rd Cross, Kolar Town 563101','2026-05-01','Aadhaar','4321-8765-0001','KL001','Pending',NOW()),
('TV_002','Lakshmi Devi','9880011002','Mohammed Rafi','9880022002','22 Mosque Road, Bengaluru 560001','12 Gulpet, Kolar 563101','2026-04-15','Aadhaar','4321-8765-0002','KL002','Verified',NOW()),
('TV_003','Anand Shetty','9880011003','Priya Sharma','9880022003','8 Rose Garden, Mangaluru 575001','55 Indiranagar, Bengaluru 560038','2026-05-10','VoterID','KA/01/123/456789','PS007','Pending',NOW());

-- ============================================================
-- SEED DATA: lost_articles (3 sample e-lost reports)
-- ============================================================
DELETE FROM `lost_articles`;
INSERT INTO `lost_articles` (`report_id`,`report_number`,`applicant_name`,`applicant_phone`,`applicant_address`,`article_type`,`article_description`,`imei_number`,`vehicle_number`,`document_type`,`date_lost`,`place_lost`,`station_id`,`status`,`created_at`) VALUES
('EL_001','ELOST/2026/0001','Kavitha R.','9880033001','15 Noor Nagar, Kolar 563101','Mobile Phone','Samsung Galaxy S23, Black colour, 256GB','352018011234567','','','2026-05-20','Kolar Bus Stand, near ticket counter','KL001','Reported',NOW()),
('EL_002','ELOST/2026/0002','Raju KGF','9880033002','Robertsonpet, KGF 563122','Vehicle','Honda Activa 6G, Blue, 2023 model','','KA-07-EF-4521','','2026-05-18','KGF Main Road, near market','KL011','Reported',NOW()),
('EL_003','ELOST/2026/0003','Anitha B.','9880033003','Malleshwaram, Bengaluru 560003','Documents','Aadhaar card, PAN card, Driving Licence - all originals','','','Aadhaar/PAN/DL','2026-05-22','Malleshwaram Market, Bengaluru','PS025','Found',NOW());

-- ============================================================
-- SEED DATA: event_permissions (3 sample requests)
-- ============================================================
DELETE FROM `event_permissions`;
INSERT INTO `event_permissions` (`perm_id`,`applicant_name`,`organization`,`phone`,`event_type`,`event_name`,`expected_crowd`,`event_date`,`event_time`,`venue`,`station_id`,`status`,`conditions`,`created_at`) VALUES
('EP_001','Suresh Naik','Kolar Town Cultural Association','9880044001','Cultural Program','Rajyotsava Celebration 2026',500,'2026-11-01','06:00 PM - 10:00 PM','Kolar Town Stadium, Near DC Office','KL001','Approved','No loudspeakers after 10 PM. Police escort required.',NOW()),
('EP_002','Mohammed Hussain','Dandeli Business Federation','9880044002','Procession','Eid Milad-un-Nabi Procession',1200,'2026-09-15','08:00 AM - 12:00 PM','Dandeli Town Main Road','PS_DT01','Pending','',NOW()),
('EP_003','Vijay Kumar','BJP Kolar District','9880044003','Political Rally','Public Meeting',2000,'2026-06-15','04:00 PM - 08:00 PM','Kolar District Grounds','KL001','Conditional','Sound limit 65dB. No road blocking. 50 volunteers mandatory.',NOW());

-- ============================================================
-- SEED DATA: case_timeline (entries for seeded FIRs)
-- ============================================================
DELETE FROM `case_timeline`;
INSERT INTO `case_timeline` (`fir_id`,`action`,`officer_name`,`officer_rank`,`action_date`) VALUES
('FIR_KL001','FIR Registered. Number: KAR/2026/KLR/PS/000001','System','System',DATE_SUB(NOW(), INTERVAL 7 DAY)),
('FIR_KL001','Status updated to Investigating. Case assigned to PSI Ramesh.','PSI Ramesh K.','PSI',DATE_SUB(NOW(), INTERVAL 5 DAY)),
('FIR_KL002','FIR Registered. Number: KAR/2026/KLR/PS/000002','System','System',DATE_SUB(NOW(), INTERVAL 9 DAY)),
('FIR_KL002','Status updated to Investigating. Domestic violence case — immediate action taken.','PI Ravi Kumar S.','PI',DATE_SUB(NOW(), INTERVAL 8 DAY)),
('FIR_KL003','FIR Registered. Number: KAR/2026/KLR/PS/000003','System','System',DATE_SUB(NOW(), INTERVAL 10 DAY)),
('FIR_KL003','Status updated to Investigating. Cyber cell notified. IMEI traced.','PI KGF Robertsonpet','PI',DATE_SUB(NOW(), INTERVAL 6 DAY)),
('FIR_KL003','Status updated to ChargeSheeted. Accused arrested. Charge sheet filed in court.','PI KGF Robertsonpet','PI',DATE_SUB(NOW(), INTERVAL 2 DAY)),
('FIR_KL004','FIR Registered. Number: KAR/2026/KLR/PS/000004','System','System',DATE_SUB(NOW(), INTERVAL 14 DAY)),
('FIR_KL005','FIR Registered. Number: KAR/2026/KLR/PS/000005','System','System',DATE_SUB(NOW(), INTERVAL 17 DAY)),
('FIR_KL005','Status updated to Investigating. CCTV footage reviewed. Bike identified.','PI Bangarpet Town','PI',DATE_SUB(NOW(), INTERVAL 14 DAY));

-- ============================================================
-- SEED DATA: audit_log (sample audit entries)
-- ============================================================
DELETE FROM `audit_log`;
INSERT INTO `audit_log` (`user_id`,`user_role`,`action`,`entity_type`,`entity_id`,`new_values`,`created_at`) VALUES
('USR_KLR','citizen','FIR_REGISTERED','firs','FIR_KL001','{"fir_number":"KAR/2026/KLR/PS/000001"}',DATE_SUB(NOW(), INTERVAL 7 DAY)),
('USR003','police','FIR_STATUS_UPDATE','firs','FIR_KL001','{"status":"Investigating"}',DATE_SUB(NOW(), INTERVAL 5 DAY)),
('USR_DAN','citizen','FIR_REGISTERED','firs','FIR_KL002','{"fir_number":"KAR/2026/KLR/PS/000002"}',DATE_SUB(NOW(), INTERVAL 9 DAY)),
('USR003','police','FIR_STATUS_UPDATE','firs','FIR_KL003','{"status":"ChargeSheeted"}',DATE_SUB(NOW(), INTERVAL 2 DAY)),
('USR005','admin','LOGIN','users','USR005','{"role":"admin"}',DATE_SUB(NOW(), INTERVAL 1 DAY)),
('USR006','admin','FIR_STATUS_UPDATE','firs','FIR_KL004','{"status":"Closed"}',DATE_SUB(NOW(), INTERVAL 3 DAY)),
('USR_KLR','citizen','ELOST_SUBMITTED','lost_articles','EL_001','{"report_number":"ELOST/2026/0001"}',DATE_SUB(NOW(), INTERVAL 5 DAY)),
('USR003','police','SC_VISIT_RECORDED','senior_citizens','SC_001','{"visit_date":"2026-05-25"}',DATE_SUB(NOW(), INTERVAL 1 DAY));

-- ============================================================
-- SEED DATA: noc_applications
-- ============================================================
DELETE FROM `noc_applications`;
INSERT INTO `noc_applications` (`noc_id`,`applicant_name`,`applicant_phone`,`applicant_address`,`noc_type`,`passport_file_no`,`date_of_birth`,`purpose`,`station_id`,`status`,`id_type`,`id_number`,`created_at`) VALUES
('NOC_001','Suresh K.','9880055001','15 Gandhi Nagar, Kolar 563101','Passport','','1998-06-15','Fresh Passport Application','KL001','Approved','Aadhaar','1234-5678-9001',DATE_SUB(NOW(), INTERVAL 10 DAY)),
('NOC_002','Anitha R.','9880055002','22 Noor Nagar, Kolar 563101','Character Certificate','','1995-03-20','Employment — TCS Bengaluru','KL001','Pending','Aadhaar','1234-5678-9002',DATE_SUB(NOW(), INTERVAL 5 DAY)),
('NOC_003','Mohammed F.','9880055003','Dandeli Town, Uttara Kannada 581325','Loudspeaker','','1988-11-10','Wedding Ceremony — 2 loudspeakers requested','PS_DT01','Approved','VoterID','KA/01/123/999888',DATE_SUB(NOW(), INTERVAL 3 DAY));

-- Import complete. Verify with: SELECT COUNT(*) FROM police_stations; -- should be 150

-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;

-- STORED PROCEDURES (at end - safe to fail on older MariaDB)
-- If your MariaDB doesn't support these, tables/data are safe
-- ============================================================

-- ============================================================
-- FEATURE: Predictive Crime Alert Trigger
-- When 3+ FIRs of same crime_category in same district
-- within 30 days → auto-creates advisory
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;
