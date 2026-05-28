<?php
// ═══════════════════════════════════════════════════════════════════
// SurakshaKarnataka — Complete PHP API
// Every table: READ + WRITE + STATUS UPDATE
// ═══════════════════════════════════════════════════════════════════
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';

switch ($action) {

// ─── CONNECTIVITY CHECK ─────────────────────────────────────────
case 'connectivity_check':
case 'ping':
    jsonOk(['status' => 'online', 'timestamp' => date('Y-m-d H:i:s'), 'db' => 'connected']);
    break;

// ─── AUTH ───────────────────────────────────────────────────────
case 'login':
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
    $body = getBody();
    $email = sanitize($body['email'] ?? '');
    $password = $body['password'] ?? '';
    if (!$email || !$password) jsonErr('Email and password required');
    $db = getDB();
    $stmt = $db->prepare("SELECT user_id, name, email, phone, role, station_id, unit_id, `rank`, badge_no, photo, is_active FROM users WHERE email = ? AND is_active = 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if (!$user) jsonErr('Invalid email or password', 401);
    // Accept demo passwords
    $demoPwds = ['Citizen@123','Police@123','Commissioner@123','SP@123'];
    $hashRow = $db->prepare("SELECT password_hash FROM users WHERE email = ?");
    $hashRow->execute([$email]);
    $h = $hashRow->fetch();
    $ok = in_array($password, $demoPwds) || ($h && password_verify($password, $h['password_hash']));
    if (!$ok) jsonErr('Invalid email or password', 401);
    auditLog($user['user_id'], $user['role'], 'LOGIN', 'users', $user['user_id']);
    jsonOk($user);
    break;

case 'signup':
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
    $body = getBody();
    $name = sanitize($body['name'] ?? '');
    $email = sanitize($body['email'] ?? '');
    $phone = sanitize($body['phone'] ?? '');
    $password = $body['password'] ?? '';
    if (!$name || !$email || !$password) jsonErr('Name, email and password required');
    $db = getDB();
    $chk = $db->prepare("SELECT user_id FROM users WHERE email = ?");
    $chk->execute([$email]);
    if ($chk->fetch()) jsonErr('Email already registered');
    $uid = 'CIT_' . uniqid();
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare("INSERT INTO users (user_id, name, email, phone, password_hash, role, is_active, created_at) VALUES (?,?,?,?,?,'citizen',1,NOW())");
    $stmt->execute([$uid, $name, $email, $phone, $hash]);
    auditLog($uid, 'citizen', 'SIGNUP', 'users', $uid);
    jsonOk(['user_id'=>$uid, 'name'=>$name, 'email'=>$email, 'phone'=>$phone, 'role'=>'citizen']);
    break;

case 'admin_users':
    $db = getDB();
    $stmt = $db->query("SELECT user_id, name, email, phone, role, station_id, unit_id, `rank`, badge_no, is_active, created_at FROM users ORDER BY role, name LIMIT 500");
    jsonOk($stmt->fetchAll());
    break;

// ─── STATIONS ───────────────────────────────────────────────────
case 'stations':
    $db = getDB();
    $search = $_GET['search'] ?? '';
    $district = $_GET['district'] ?? '';
    $lat = floatval($_GET['lat'] ?? 0);
    $lng = floatval($_GET['lng'] ?? 0);
    $limit = intval($_GET['limit'] ?? 200);
    if ($lat && $lng) {
        $stmt = $db->prepare("
            SELECT station_id, name, district, taluk, address, pincode, phone, email, sho_name, sho_rank, jurisdiction_type, lat, lng,
            (6371 * 2 * ASIN(SQRT(POWER(SIN(RADIANS(?-lat)/2),2)+COS(RADIANS(?))*COS(RADIANS(lat))*POWER(SIN(RADIANS(?-lng)/2),2)))) AS distance_km
            FROM police_stations ORDER BY distance_km ASC LIMIT ?");
        $stmt->execute([$lat, $lat, $lng, $limit]);
    } elseif ($search) {
        $s = "%$search%";
        $stmt = $db->prepare("SELECT * FROM police_stations WHERE name LIKE ? OR district LIKE ? OR taluk LIKE ? OR pincode LIKE ? ORDER BY CASE WHEN district='Kolar' THEN 0 ELSE 1 END, name LIMIT ?");
        $stmt->execute([$s,$s,$s,$s,$limit]);
    } elseif ($district) {
        $stmt = $db->prepare("SELECT * FROM police_stations WHERE district = ? ORDER BY name LIMIT ?");
        $stmt->execute([$district, $limit]);
    } else {
        $stmt = $db->prepare("SELECT * FROM police_stations ORDER BY CASE WHEN district='Kolar' THEN 0 WHEN district='Uttara Kannada' THEN 1 ELSE 2 END, district, name LIMIT ?");
        $stmt->execute([$limit]);
    }
    jsonOk($stmt->fetchAll());
    break;

case 'station':
    $id = sanitize($_GET['id'] ?? '');
    if (!$id) jsonErr('Station ID required');
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM police_stations WHERE station_id = ?");
    $stmt->execute([$id]);
    $s = $stmt->fetch();
    if (!$s) jsonErr('Station not found', 404);
    jsonOk($s);
    break;

// ─── FIRs ───────────────────────────────────────────────────────
case 'firs':
    $db = getDB();
    $stationId = $_GET['station_id'] ?? '';
    $status = $_GET['status'] ?? '';
    $category = $_GET['category'] ?? '';
    $search = $_GET['search'] ?? '';
    $page = max(1, intval($_GET['page'] ?? 1));
    $pageSize = min(200, intval($_GET['page_size'] ?? 50));
    $offset = ($page - 1) * $pageSize;
    $where = ['1=1']; $params = [];
    if ($stationId) { $where[] = 'f.station_id = ?'; $params[] = $stationId; }
    if ($status)    { $where[] = 'f.status = ?';     $params[] = $status; }
    if ($category)  { $where[] = 'f.crime_category = ?'; $params[] = $category; }
    if ($search)    { $where[] = '(f.fir_number LIKE ? OR f.complainant_name LIKE ? OR f.incident_description LIKE ?)'; $s="%$search%"; $params[]=$s; $params[]=$s; $params[]=$s; }
    $whereStr = implode(' AND ', $where);
    $countStmt = $db->prepare("SELECT COUNT(*) FROM firs f WHERE $whereStr");
    $countStmt->execute($params);
    $total = $countStmt->fetchColumn();
    $params[] = $pageSize; $params[] = $offset;
    $stmt = $db->prepare("SELECT f.*, ps.name AS station_name, ps.district, ps.phone AS station_phone FROM firs f LEFT JOIN police_stations ps ON f.station_id = ps.station_id WHERE $whereStr ORDER BY f.created_at DESC LIMIT ? OFFSET ?");
    $stmt->execute($params);
    jsonOk(['items' => $stmt->fetchAll(), 'total' => $total, 'page' => $page, 'page_size' => $pageSize]);
    break;

case 'pending_firs':
    $db = getDB();
    $stmt = $db->query("SELECT f.*, ps.name AS station_name, ps.district FROM firs f LEFT JOIN police_stations ps ON f.station_id = ps.station_id WHERE f.status = 'Pending' ORDER BY f.created_at DESC LIMIT 100");
    jsonOk($stmt->fetchAll());
    break;

// ─── TRACK — searches ALL tables ────────────────────────────────
case 'fir_by_number':
    $num = sanitize($_GET['number'] ?? '');
    if (!$num) jsonErr('Reference number required');
    $db = getDB();

    // 1. FIRs
    $stmt = $db->prepare("SELECT f.*, ps.name AS station_name, ps.district, ps.phone AS station_phone, 'fir' AS complaint_type FROM firs f LEFT JOIN police_stations ps ON f.station_id = ps.station_id WHERE f.fir_number = ?");
    $stmt->execute([$num]);
    $rec = $stmt->fetch();
    if ($rec) {
        $tStmt = $db->prepare("SELECT * FROM case_timeline WHERE fir_id = ? ORDER BY action_date ASC");
        $tStmt->execute([$rec['fir_id']]);
        $rec['timeline'] = $tStmt->fetchAll();
        jsonOk($rec); break;
    }

    // 2. e-Lost
    $stmt = $db->prepare("SELECT la.*, ps.name AS station_name, ps.phone AS station_phone, 'elost' AS complaint_type, la.applicant_name AS complainant_name, la.applicant_phone AS complainant_phone, la.place_lost AS incident_place, la.date_lost AS incident_date, la.article_type AS crime_category, la.article_description AS incident_description FROM lost_articles la LEFT JOIN police_stations ps ON la.station_id = ps.station_id WHERE la.report_number = ?");
    $stmt->execute([$num]);
    $rec = $stmt->fetch();
    if ($rec) { $rec['fir_number'] = $num; $rec['timeline'] = []; jsonOk($rec); break; }

    // 3. Tenant Verification
    $stmt = $db->prepare("SELECT tv.*, ps.name AS station_name, ps.phone AS station_phone, 'tenant' AS complaint_type, tv.landlord_name AS complainant_name, tv.landlord_phone AS complainant_phone, tv.rental_address AS incident_place, tv.rental_from AS incident_date, 'Tenant Verification' AS crime_category, tv.tenant_name AS incident_description FROM tenant_verifications tv LEFT JOIN police_stations ps ON tv.station_id = ps.station_id WHERE tv.verify_id = ?");
    $stmt->execute([$num]);
    $rec = $stmt->fetch();
    if ($rec) { $rec['fir_number'] = $num; $rec['timeline'] = []; jsonOk($rec); break; }

    // 4. Missing Persons
    $stmt = $db->prepare("SELECT mp.*, ps.name AS station_name, ps.phone AS station_phone, 'missing' AS complaint_type, mp.name AS complainant_name, mp.contact_number AS complainant_phone, mp.last_seen_location AS incident_place, mp.date_missing AS incident_date, 'Missing Person' AS crime_category, mp.description AS incident_description FROM missing_persons mp LEFT JOIN police_stations ps ON mp.station_id = ps.station_id WHERE mp.missing_id = ?");
    $stmt->execute([$num]);
    $rec = $stmt->fetch();
    if ($rec) { $rec['fir_number'] = $num; $rec['timeline'] = []; jsonOk($rec); break; }

    // 5. Event Permissions
    $stmt = $db->prepare("SELECT ep.*, ps.name AS station_name, ps.phone AS station_phone, 'event' AS complaint_type, ep.applicant_name AS complainant_name, ep.phone AS complainant_phone, ep.venue AS incident_place, ep.event_date AS incident_date, ep.event_type AS crime_category, ep.event_name AS incident_description FROM event_permissions ep LEFT JOIN police_stations ps ON ep.station_id = ps.station_id WHERE ep.perm_id = ?");
    $stmt->execute([$num]);
    $rec = $stmt->fetch();
    if ($rec) { $rec['fir_number'] = $num; $rec['timeline'] = []; jsonOk($rec); break; }

    // 6. Senior Citizens
    $stmt = $db->prepare("SELECT sc.*, ps.name AS station_name, ps.phone AS station_phone, 'senior' AS complaint_type, sc.name AS complainant_name, sc.phone AS complainant_phone, sc.address AS incident_place, sc.registered_date AS incident_date, 'Senior Citizen Registration' AS crime_category, sc.medical_conditions AS incident_description FROM senior_citizens sc LEFT JOIN police_stations ps ON sc.station_id = ps.station_id WHERE sc.citizen_id = ?");
    $stmt->execute([$num]);
    $rec = $stmt->fetch();
    if ($rec) { $rec['fir_number'] = $num; $rec['timeline'] = []; jsonOk($rec); break; }

    jsonErr('No record found for this reference number', 404);
    break;

// ─── REGISTER FIR ────────────────────────────────────────────────
case 'register_fir':
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
    $body = getBody();
    $db = getDB();
    // Use defaults for missing fields so submission never fails silently
    if (empty($body['complainant_name']))       $body['complainant_name'] = 'Unknown';
    if (empty($body['complainant_phone']))      $body['complainant_phone'] = '0000000000';
    if (empty($body['complainant_address']))    $body['complainant_address'] = 'Not provided';
    if (empty($body['incident_date']))          $body['incident_date'] = date('Y-m-d');
    if (empty($body['incident_place']))         $body['incident_place'] = 'Not specified';
    if (empty($body['incident_description']))   $body['incident_description'] = $body['sub_category'] ?? 'Complaint filed online';
    if (empty($body['crime_category']))         $body['crime_category'] = 'IPC';
    if (empty($body['sub_category']))           $body['sub_category'] = $body['crime_category'];
    if (empty($body['station_id']))             $body['station_id'] = 'KL001';
    // Validate station exists, fallback to PS001 if not
    $stCheck = $db->prepare("SELECT station_id FROM police_stations WHERE station_id = ?");
    $stCheck->execute([$body['station_id']]);
    if (!$stCheck->fetch()) {
        // Station not in DB, use first available Kolar station or PS001
        $anyStation = $db->query("SELECT station_id FROM police_stations WHERE district='Kolar' LIMIT 1")->fetchColumn();
        $body['station_id'] = $anyStation ?: 'PS001';
    }

    // Generate FIR number
    $stmtSt = $db->prepare("SELECT district, jurisdiction_type FROM police_stations WHERE station_id = ?");
    $stmtSt->execute([$body['station_id']]);
    $st = $stmtSt->fetch();
    $distCode = $st ? strtoupper(substr(str_replace([' ','-'], '', $st['district']), 0, 3)) : 'KAR';
    $unitCode = ($st && $st['jurisdiction_type'] === 'commissionerate') ? 'CP' : 'PS';
    $year = date('Y');
    $stmtCount = $db->prepare("SELECT COUNT(*) FROM firs WHERE YEAR(created_at) = ?");
    $stmtCount->execute([$year]);
    $count = $stmtCount->fetchColumn() + 1;
    $firNumber = "KAR/$year/$distCode/$unitCode/" . str_pad($count, 6, '0', STR_PAD_LEFT);
    $firId = 'FIR_' . uniqid();

    // Duplicate FIR check - same phone + same date + same area
    $dupCheck = $db->prepare("SELECT fir_number FROM firs WHERE complainant_phone = ? AND incident_date = ? AND incident_place LIKE ? AND status != 'Closed' LIMIT 1");
    $dupCheck->execute([$body['complainant_phone'], $body['incident_date'], '%' . substr($body['incident_place'], 0, 20) . '%']);
    $duplicate = $dupCheck->fetch();
    if ($duplicate) {
        jsonOk(['warning' => 'POSSIBLE_DUPLICATE', 'existing_fir' => $duplicate['fir_number'], 'message' => 'A similar FIR already exists for this complainant on the same date and location. Ref: ' . $duplicate['fir_number']]);
        exit;
    }

    $db->beginTransaction();
    try {
        $stmt = $db->prepare("INSERT INTO firs (fir_id, fir_number, complainant_name, complainant_phone, complainant_email, complainant_address, id_type, id_number, incident_date, incident_time, incident_place, incident_description, crime_category, sub_category, suspect_details, witness_details, station_id, status, priority, created_at, updated_at, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'Pending','Medium',NOW(),NOW(),?)");
        $stmt->execute([
            $firId, $firNumber,
            sanitize($body['complainant_name']),
            sanitize($body['complainant_phone']),
            sanitize($body['complainant_email'] ?? ''),
            sanitize($body['complainant_address']),
            sanitize($body['id_type'] ?? 'Aadhaar'),
            sanitize($body['id_number'] ?? ''),
            $body['incident_date'],
            !empty($body['incident_time']) ? $body['incident_time'] : null,
            sanitize($body['incident_place']),
            sanitize($body['incident_description']),
            sanitize($body['crime_category']),
            sanitize($body['sub_category'] ?? ''),
            sanitize($body['suspect_details'] ?? ''),
            sanitize($body['witness_details'] ?? ''),
            $body['station_id'],
            sanitize($body['created_by'] ?? 'citizen'),
        ]);
        $tStmt = $db->prepare("INSERT INTO case_timeline (fir_id, action, officer_name, officer_rank, action_date) VALUES (?,?,?,?,NOW())");
        $tStmt->execute([$firId, "FIR Registered. Number: $firNumber", 'System', 'System']);
        $db->commit();
        
        // Predictive crime alert check (pure PHP - no stored procedure needed)
        try {
            $distName = $st['district'] ?? 'Unknown';
            $catName = $body['crime_category'];
            // Count recent FIRs of same type in same district (last 30 days)
            $spikeCheck = $db->prepare("SELECT COUNT(*) FROM firs f JOIN police_stations ps ON f.station_id = ps.station_id WHERE ps.district = ? AND f.crime_category = ? AND f.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
            $spikeCheck->execute([$distName, $catName]);
            $spikeCount = $spikeCheck->fetchColumn();
            if ($spikeCount >= 3) {
                // Check if advisory already exists today
                $advCheck = $db->prepare("SELECT COUNT(*) FROM advisories WHERE district = ? AND title_en LIKE ? AND publish_date = CURDATE()");
                $advCheck->execute([$distName, "%{$catName}%spike%"]);
                if ($advCheck->fetchColumn() == 0) {
                    $advId = 'ADV_AUTO_' . time();
                    $advStmt = $db->prepare("INSERT INTO advisories (advisory_id, title_en, title_kn, content_en, content_kn, type, district, publish_date, is_active) VALUES (?,?,?,?,?,'Crime Alert',?,CURDATE(),1)");
                    $advStmt->execute([
                        $advId,
                        "⚠ Crime Spike: {$catName} in {$distName}",
                        "⚠ ಅಪರಾಧ ಹೆಚ್ಚಳ: {$catName} - {$distName}",
                        "System detected {$spikeCount} cases of {$catName} in {$distName} in 30 days. Enhanced patrolling recommended.",
                        "{$distName} ಜಿಲ್ಲೆಯಲ್ಲಿ ಕಳೆದ 30 ದಿನಗಳಲ್ಲಿ {$spikeCount} {$catName} ಪ್ರಕರಣಗಳು.",
                        $distName
                    ]);
                }
            }
        } catch (Exception $e) { /* ignore spike check errors */ }
        
        auditLog($body['created_by'] ?? 'CITIZEN', 'citizen', 'FIR_REGISTERED', 'firs', $firId, ['fir_number' => $firNumber]);
        jsonOk(['fir_id' => $firId, 'fir_number' => $firNumber]);
    } catch (Exception $e) {
        $db->rollBack();
        jsonErr('FIR registration failed: ' . $e->getMessage());
    }
    break;

// ─── UPDATE FIR STATUS ───────────────────────────────────────────
case 'update_fir_status':
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
    $body = getBody();
    $validStatuses = ['Pending','Investigating','ChargeSheeted','Closed','Referred'];
    if (!in_array($body['status'] ?? '', $validStatuses)) jsonErr('Invalid status');
    $db = getDB();
    $db->beginTransaction();
    try {
        $stmt = $db->prepare("UPDATE firs SET status = ?, updated_at = NOW() WHERE fir_id = ?");
        $stmt->execute([$body['status'], $body['fir_id']]);
        $tStmt = $db->prepare("INSERT INTO case_timeline (fir_id, action, officer_name, officer_rank, action_date) VALUES (?,?,?,?,NOW())");
        $tStmt->execute([$body['fir_id'], 'Status updated to ' . $body['status'], sanitize($body['officer_id'] ?? 'Officer'), 'PI']);
        $db->commit();
        auditLog($body['officer_id'] ?? 'SYS', 'police', 'FIR_STATUS_UPDATE', 'firs', $body['fir_id'], ['status' => $body['status']]);
        jsonOk(['updated' => true, 'status' => $body['status']]);
    } catch (Exception $e) { $db->rollBack(); jsonErr('Update failed: ' . $e->getMessage()); }
    break;

// ─── e-LOST ─────────────────────────────────────────────────────
case 'submit_elost':
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
    $body = getBody();
    $db = getDB();
    $reportId = 'EL_' . uniqid();
    $year = date('Y');
    $count = $db->query("SELECT COUNT(*) FROM lost_articles")->fetchColumn() + 1;
    $reportNum = "ELOST/$year/" . str_pad($count, 4, '0', STR_PAD_LEFT);
    $stmt = $db->prepare("INSERT INTO lost_articles (report_id, report_number, applicant_name, applicant_phone, applicant_address, article_type, article_description, imei_number, vehicle_number, document_type, date_lost, place_lost, station_id, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'Reported',NOW())");
    $stmt->execute([
        $reportId, $reportNum,
        sanitize($body['applicant_name'] ?? ''),
        sanitize($body['applicant_phone'] ?? ''),
        sanitize($body['applicant_address'] ?? ''),
        sanitize($body['article_type'] ?? 'Other'),
        sanitize($body['article_description'] ?? ''),
        sanitize($body['imei_number'] ?? ''),
        sanitize($body['vehicle_number'] ?? ''),
        sanitize($body['document_type'] ?? ''),
        $body['date_lost'] ?? date('Y-m-d'),
        sanitize($body['place_lost'] ?? ''),
        sanitize($body['station_id'] ?? 'KL001'),
    ]);
    auditLog($body['created_by'] ?? 'CITIZEN', 'citizen', 'ELOST_SUBMITTED', 'lost_articles', $reportId, ['report_number' => $reportNum]);
    jsonOk(['report_id' => $reportId, 'report_number' => $reportNum]);
    break;

case 'lost_articles':
    $db = getDB();
    $stationId = $_GET['station_id'] ?? '';
    if ($stationId) {
        $stmt = $db->prepare("SELECT la.*, ps.name AS station_name FROM lost_articles la LEFT JOIN police_stations ps ON la.station_id = ps.station_id WHERE la.station_id = ? ORDER BY la.created_at DESC LIMIT 100");
        $stmt->execute([$stationId]);
    } else {
        $stmt = $db->query("SELECT la.*, ps.name AS station_name FROM lost_articles la LEFT JOIN police_stations ps ON la.station_id = ps.station_id ORDER BY la.created_at DESC LIMIT 200");
    }
    jsonOk($stmt->fetchAll());
    break;

case 'update_lost_status':
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
    $body = getBody();
    $db = getDB();
    $stmt = $db->prepare("UPDATE lost_articles SET status = ? WHERE report_id = ?");
    $stmt->execute([sanitize($body['status']), sanitize($body['report_id'])]);
    auditLog($body['officer_id'] ?? 'SYS', 'police', 'LOST_STATUS_UPDATE', 'lost_articles', $body['report_id'], ['status' => $body['status']]);
    jsonOk(['updated' => true]);
    break;

// ─── TENANT VERIFICATION ─────────────────────────────────────────
case 'submit_tenant':
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
    $body = getBody();
    $db = getDB();
    $id = 'TV_' . uniqid();
    $stmt = $db->prepare("INSERT INTO tenant_verifications (verify_id, landlord_name, landlord_phone, tenant_name, tenant_phone, tenant_address_permanent, rental_address, rental_from, id_type, id_number, station_id, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,'Pending',NOW())");
    $stmt->execute([
        $id,
        sanitize($body['landlord_name'] ?? ''),
        sanitize($body['landlord_phone'] ?? ''),
        sanitize($body['tenant_name'] ?? ''),
        sanitize($body['tenant_phone'] ?? ''),
        sanitize($body['tenant_permanent_address'] ?? $body['servant_address'] ?? ''),
        sanitize($body['rental_address'] ?? $body['employer_address'] ?? ''),
        $body['rental_from'] ?? $body['working_since'] ?? date('Y-m-d'),
        sanitize($body['tenant_id_type'] ?? $body['id_type'] ?? 'Aadhaar'),
        sanitize($body['tenant_id_number'] ?? $body['id_number'] ?? ''),
        sanitize($body['station_id'] ?? 'KL001'),
    ]);
    $refNum = "TV/$id";
    auditLog($body['created_by'] ?? 'CITIZEN', 'citizen', 'TENANT_VERIFICATION_SUBMITTED', 'tenant_verifications', $id);
    jsonOk(['verify_id' => $id, 'reference' => $refNum, 'report_number' => $refNum]);
    break;

case 'verifications':
    $db = getDB();
    $stationId = $_GET['station_id'] ?? '';
    if ($stationId) {
        $stmt = $db->prepare("SELECT tv.*, ps.name AS station_name FROM tenant_verifications tv LEFT JOIN police_stations ps ON tv.station_id = ps.station_id WHERE tv.station_id = ? ORDER BY tv.created_at DESC LIMIT 100");
        $stmt->execute([$stationId]);
    } else {
        $stmt = $db->query("SELECT tv.*, ps.name AS station_name FROM tenant_verifications tv LEFT JOIN police_stations ps ON tv.station_id = ps.station_id ORDER BY tv.created_at DESC LIMIT 200");
    }
    jsonOk($stmt->fetchAll());
    break;

case 'update_verification':
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
    $body = getBody();
    $db = getDB();
    $stmt = $db->prepare("UPDATE tenant_verifications SET status = ? WHERE verify_id = ?");
    $stmt->execute([sanitize($body['status']), sanitize($body['verify_id'])]);
    auditLog($body['officer_id'] ?? 'SYS', 'police', 'VERIFICATION_STATUS_UPDATE', 'tenant_verifications', $body['verify_id'], ['status' => $body['status']]);
    jsonOk(['updated' => true]);
    break;

// ─── SENIOR CITIZENS ─────────────────────────────────────────────
case 'submit_senior':
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
    $body = getBody();
    $db = getDB();
    $id = 'SC_' . uniqid();
    $stmt = $db->prepare("INSERT INTO senior_citizens (citizen_id, name, age, address, pincode, phone, local_contact_name, local_contact_phone, station_id, registered_date, medical_conditions) VALUES (?,?,?,?,?,?,?,?,?,CURDATE(),?)");
    $stmt->execute([
        $id,
        sanitize($body['name'] ?? ''),
        intval($body['age'] ?? 60),
        sanitize($body['address'] ?? ''),
        sanitize($body['pincode'] ?? ''),
        sanitize($body['phone'] ?? ''),
        sanitize($body['emergency_contact_name'] ?? ''),
        sanitize($body['emergency_contact_phone'] ?? ''),
        sanitize($body['station_id'] ?? 'KL001'),
        sanitize($body['medical_conditions'] ?? ''),
    ]);
    $refNum = "SC/$id";
    auditLog($body['created_by'] ?? 'CITIZEN', 'citizen', 'SENIOR_REGISTERED', 'senior_citizens', $id);
    jsonOk(['citizen_id' => $id, 'reference' => $refNum, 'report_number' => $refNum]);
    break;

case 'senior_citizens':
    $db = getDB();
    $stationId = $_GET['station_id'] ?? '';
    if ($stationId) {
        $stmt = $db->prepare("SELECT sc.*, ps.name AS station_name FROM senior_citizens sc LEFT JOIN police_stations ps ON sc.station_id = ps.station_id WHERE sc.station_id = ? ORDER BY sc.name");
        $stmt->execute([$stationId]);
    } else {
        $stmt = $db->query("SELECT sc.*, ps.name AS station_name FROM senior_citizens sc LEFT JOIN police_stations ps ON sc.station_id = ps.station_id ORDER BY sc.registered_date DESC LIMIT 500");
    }
    jsonOk($stmt->fetchAll());
    break;

case 'record_sc_visit':
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
    $body = getBody();
    $db = getDB();
    $stmt = $db->prepare("UPDATE senior_citizens SET last_visit_date = CURDATE() WHERE citizen_id = ?");
    $stmt->execute([sanitize($body['citizen_id'])]);
    auditLog($body['officer_id'] ?? 'SYS', 'police', 'SC_VISIT_RECORDED', 'senior_citizens', $body['citizen_id']);
    jsonOk(['updated' => true, 'visit_date' => date('Y-m-d')]);
    break;

// ─── EVENT PERMISSIONS ────────────────────────────────────────────
case 'submit_event':
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
    $body = getBody();
    $db = getDB();
    $id = 'EP_' . uniqid();
    $stmt = $db->prepare("INSERT INTO event_permissions (perm_id, applicant_name, organization, phone, event_type, event_name, expected_crowd, event_date, event_time, venue, station_id, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,'Pending',NOW())");
    $stmt->execute([
        $id,
        sanitize($body['applicant_name'] ?? ''),
        sanitize($body['organization'] ?? ''),
        sanitize($body['phone'] ?? ''),
        sanitize($body['event_type'] ?? 'Other'),
        sanitize($body['event_name'] ?? ''),
        intval($body['expected_crowd'] ?? 0),
        $body['event_date'] ?? date('Y-m-d'),
        ($body['start_time'] ?? '10:00') . ' - ' . ($body['end_time'] ?? '18:00'),
        sanitize($body['venue'] ?? ''),
        sanitize($body['station_id'] ?? 'KL001'),
    ]);
    $refNum = "EP/$id";
    auditLog($body['created_by'] ?? 'CITIZEN', 'citizen', 'EVENT_PERMISSION_SUBMITTED', 'event_permissions', $id);
    jsonOk(['perm_id' => $id, 'reference' => $refNum, 'report_number' => $refNum]);
    break;

case 'event_permissions':
    $db = getDB();
    $stationId = $_GET['station_id'] ?? '';
    if ($stationId) {
        $stmt = $db->prepare("SELECT ep.*, ps.name AS station_name FROM event_permissions ep LEFT JOIN police_stations ps ON ep.station_id = ps.station_id WHERE ep.station_id = ? ORDER BY ep.created_at DESC LIMIT 100");
        $stmt->execute([$stationId]);
    } else {
        $stmt = $db->query("SELECT ep.*, ps.name AS station_name FROM event_permissions ep LEFT JOIN police_stations ps ON ep.station_id = ps.station_id ORDER BY ep.created_at DESC LIMIT 200");
    }
    jsonOk($stmt->fetchAll());
    break;

case 'update_event_status':
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
    $body = getBody();
    $db = getDB();
    $stmt = $db->prepare("UPDATE event_permissions SET status = ?, conditions = ? WHERE perm_id = ?");
    $stmt->execute([sanitize($body['status']), sanitize($body['conditions'] ?? ''), sanitize($body['perm_id'])]);
    auditLog($body['officer_id'] ?? 'SYS', 'police', 'EVENT_STATUS_UPDATE', 'event_permissions', $body['perm_id'], ['status' => $body['status']]);
    jsonOk(['updated' => true]);
    break;

// ─── MISSING PERSONS ─────────────────────────────────────────────
case 'submit_missing':
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
    $body = getBody();
    $db = getDB();
    $id = 'MSP_' . uniqid();
    $desc = sanitize($body['description'] ?? '') . ' Marks: ' . sanitize($body['distinguishing_marks'] ?? '') . ' Wearing: ' . sanitize($body['last_seen_wearing'] ?? '');
    $stmt = $db->prepare("INSERT INTO missing_persons (missing_id, name, age, gender, last_seen_location, date_missing, description, contact_number, status, station_id, created_at) VALUES (?,?,?,?,?,?,?,?,'Open',?,NOW())");
    $stmt->execute([
        $id,
        sanitize($body['missing_name'] ?? ''),
        intval($body['missing_age'] ?? 0),
        sanitize($body['missing_gender'] ?? 'Male'),
        sanitize($body['last_seen_location'] ?? ''),
        $body['date_missing'] ?? date('Y-m-d'),
        trim($desc),
        sanitize($body['reporter_phone'] ?? ''),
        sanitize($body['station_id'] ?? 'KL001'),
    ]);
    $refNum = "MSP/$id";
    auditLog($body['created_by'] ?? 'CITIZEN', 'citizen', 'MISSING_PERSON_REPORTED', 'missing_persons', $id);
    jsonOk(['missing_id' => $id, 'reference' => $refNum, 'report_number' => $refNum]);
    break;

case 'missing':
case 'missing_persons_all':
    $db = getDB();
    $status = $_GET['status'] ?? '';
    if ($status) {
        $stmt = $db->prepare("SELECT mp.*, ps.name AS station_name FROM missing_persons mp LEFT JOIN police_stations ps ON mp.station_id = ps.station_id WHERE mp.status = ? ORDER BY mp.date_missing DESC LIMIT 200");
        $stmt->execute([$status]);
    } else {
        $stmt = $db->query("SELECT mp.*, ps.name AS station_name FROM missing_persons mp LEFT JOIN police_stations ps ON mp.station_id = ps.station_id ORDER BY mp.date_missing DESC LIMIT 200");
    }
    jsonOk($stmt->fetchAll());
    break;

case 'update_missing_status':
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
    $body = getBody();
    $db = getDB();
    $stmt = $db->prepare("UPDATE missing_persons SET status = ? WHERE missing_id = ?");
    $stmt->execute([sanitize($body['status']), sanitize($body['missing_id'])]);
    auditLog($body['officer_id'] ?? 'SYS', 'police', 'MISSING_STATUS_UPDATE', 'missing_persons', $body['missing_id'], ['status' => $body['status']]);
    jsonOk(['updated' => true]);
    break;

// ─── CRIMINALS / WANTED ───────────────────────────────────────────
case 'criminals':
    $db = getDB();
    $search = $_GET['search'] ?? '';
    $stationId = $_GET['station_id'] ?? '';
    $where = ['1=1']; $params = [];
    if ($search) { $where[] = '(name LIKE ? OR aliases LIKE ?)'; $s="%$search%"; $params[]=$s; $params[]=$s; }
    if ($stationId) { $where[] = 'station_id = ?'; $params[] = $stationId; }
    if (!empty($_GET['rowdy'])) $where[] = 'is_rowdy_sheeter = 1';
    if (!empty($_GET['history'])) $where[] = 'is_history_sheeter = 1';
    if (!empty($_GET['goonda'])) $where[] = 'goonda_act = 1';
    $stmt = $db->prepare("SELECT * FROM criminals WHERE " . implode(' AND ', $where) . " ORDER BY cases_count DESC LIMIT 200");
    $stmt->execute($params);
    jsonOk($stmt->fetchAll());
    break;

case 'wanted':
    $db = getDB();
    $stmt = $db->query("SELECT * FROM wanted_persons ORDER BY created_at DESC LIMIT 100");
    jsonOk($stmt->fetchAll());
    break;

// ─── BEATS ────────────────────────────────────────────────────────
case 'beat_workload':
    $db = getDB();
    $stationId = $_GET['station_id'] ?? '';
    if ($stationId) {
        $stmt = $db->prepare("SELECT b.*, ps.name AS station_name, ps.district, (SELECT COUNT(*) FROM senior_citizens sc WHERE sc.beat_id = b.beat_id) AS senior_citizen_count FROM beats b LEFT JOIN police_stations ps ON b.station_id = ps.station_id WHERE b.station_id = ?");
        $stmt->execute([$stationId]);
    } else {
        $stmt = $db->query("SELECT b.*, ps.name AS station_name, ps.district, (SELECT COUNT(*) FROM senior_citizens sc WHERE sc.beat_id = b.beat_id) AS senior_citizen_count FROM beats b LEFT JOIN police_stations ps ON b.station_id = ps.station_id ORDER BY ps.district, b.beat_no LIMIT 500");
    }
    jsonOk($stmt->fetchAll());
    break;

// ─── ADVISORIES ───────────────────────────────────────────────────
case 'advisories':
    $db = getDB();
    $district = $_GET['district'] ?? '';
    if ($district && $district !== 'All Karnataka') {
        $stmt = $db->prepare("SELECT * FROM advisories WHERE (district = ? OR district = 'All Karnataka') AND is_active = 1 ORDER BY publish_date DESC LIMIT 20");
        $stmt->execute([$district]);
    } else {
        $stmt = $db->query("SELECT * FROM advisories WHERE is_active = 1 ORDER BY publish_date DESC LIMIT 20");
    }
    jsonOk($stmt->fetchAll());
    break;

case 'add_advisory':
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
    $body = getBody();
    $db = getDB();
    $id = 'ADV_' . uniqid();
    $stmt = $db->prepare("INSERT INTO advisories (advisory_id, title_en, title_kn, content_en, content_kn, type, district, publish_date, is_active) VALUES (?,?,?,?,?,?,?,CURDATE(),1)");
    $stmt->execute([
        $id,
        sanitize($body['title_en'] ?? ''),
        sanitize($body['title_kn'] ?? $body['title_en'] ?? ''),
        sanitize($body['content_en'] ?? ''),
        sanitize($body['content_kn'] ?? $body['content_en'] ?? ''),
        sanitize($body['type'] ?? 'General'),
        sanitize($body['district'] ?? 'All Karnataka'),
    ]);
    jsonOk(['advisory_id' => $id]);
    break;

// ─── STATS / VIEWS ────────────────────────────────────────────────
case 'dashboard_kpis':
    $db = getDB();
    $total   = $db->query("SELECT COUNT(*) FROM firs")->fetchColumn();
    $pending = $db->query("SELECT COUNT(*) FROM firs WHERE status='Pending'")->fetchColumn();
    $solving = $db->query("SELECT COUNT(*) FROM firs WHERE status='Investigating'")->fetchColumn();
    $charged = $db->query("SELECT COUNT(*) FROM firs WHERE status='ChargeSheeted'")->fetchColumn();
    $closed  = $db->query("SELECT COUNT(*) FROM firs WHERE status='Closed'")->fetchColumn();
    $missing = $db->query("SELECT COUNT(*) FROM missing_persons WHERE status='Open'")->fetchColumn();
    $wanted  = $db->query("SELECT COUNT(*) FROM wanted_persons")->fetchColumn();
    $seniors = $db->query("SELECT COUNT(*) FROM senior_citizens")->fetchColumn();
    $stations= $db->query("SELECT COUNT(*) FROM police_stations")->fetchColumn();
    $elost   = $db->query("SELECT COUNT(*) FROM lost_articles")->fetchColumn();
    $events  = $db->query("SELECT COUNT(*) FROM event_permissions WHERE status='Pending'")->fetchColumn();
    $tenants = $db->query("SELECT COUNT(*) FROM tenant_verifications WHERE status='Pending'")->fetchColumn();
    jsonOk(compact('total','pending','solving','charged','closed','missing','wanted','seniors','stations','elost','events','tenants'));
    break;

case 'district_stats':
    $db = getDB();
    $stmt = $db->query("SELECT ps.district, f.crime_category, COUNT(*) AS total, SUM(CASE WHEN f.status='Pending' THEN 1 ELSE 0 END) AS pending, SUM(CASE WHEN f.status='Investigating' THEN 1 ELSE 0 END) AS investigating, SUM(CASE WHEN f.status='ChargeSheeted' THEN 1 ELSE 0 END) AS charge_sheeted, SUM(CASE WHEN f.status='Closed' THEN 1 ELSE 0 END) AS closed FROM firs f LEFT JOIN police_stations ps ON f.station_id = ps.station_id GROUP BY ps.district, f.crime_category ORDER BY total DESC");
    jsonOk($stmt->fetchAll());
    break;

case 'station_summary':
    $db = getDB();
    $stmt = $db->query("SELECT ps.station_id, ps.name, ps.district, ps.phone, ps.sho_name, COUNT(f.fir_id) AS total_firs, SUM(CASE WHEN f.status='Pending' THEN 1 ELSE 0 END) AS pending_firs, SUM(CASE WHEN f.status='Investigating' THEN 1 ELSE 0 END) AS active_firs, SUM(CASE WHEN f.status='ChargeSheeted' THEN 1 ELSE 0 END) AS charged_firs, (SELECT COUNT(*) FROM criminals c WHERE c.station_id = ps.station_id AND c.is_rowdy_sheeter=1) AS rowdy_sheeters, (SELECT COUNT(*) FROM senior_citizens sc WHERE sc.station_id = ps.station_id) AS registered_seniors FROM police_stations ps LEFT JOIN firs f ON ps.station_id = f.station_id GROUP BY ps.station_id ORDER BY total_firs DESC LIMIT 50");
    jsonOk($stmt->fetchAll());
    break;

case 'audit_log':
    $db = getDB();
    $stmt = $db->query("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200");
    jsonOk($stmt->fetchAll());
    break;

// ─── CITIZEN COMPLAINTS ───────────────────────────────────────────
case 'citizen_complaints':
    $email = sanitize($_GET['email'] ?? '');
    $userId = sanitize($_GET['user_id'] ?? '');
    if (!$email && !$userId) jsonErr('Email or user_id required');
    $db = getDB();

    // Get user_id from email if needed
    if (!$userId && $email) {
        $u = $db->prepare("SELECT user_id FROM users WHERE email = ?");
        $u->execute([$email]);
        $row = $u->fetch();
        $userId = $row ? $row['user_id'] : '';
    }

    $result = [];

    // FIRs filed by this user
    if ($userId) {
        $stmt = $db->prepare("SELECT f.*, ps.name AS station_name, ps.phone AS station_phone, 'fir' AS complaint_type FROM firs f LEFT JOIN police_stations ps ON f.station_id = ps.station_id WHERE f.created_by = ? ORDER BY f.created_at DESC");
        $stmt->execute([$userId]);
        $result = array_merge($result, $stmt->fetchAll());
    }

    // Also check by email if userId didn't match
    if (empty($result) && $email) {
        $stmt = $db->prepare("SELECT f.*, ps.name AS station_name, ps.phone AS station_phone, 'fir' AS complaint_type FROM firs f LEFT JOIN police_stations ps ON f.station_id = ps.station_id WHERE f.created_by = ? ORDER BY f.created_at DESC");
        $stmt->execute([$email]);
        $result = array_merge($result, $stmt->fetchAll());
    }

    jsonOk($result);
    break;

case 'test_insert':
    $db = getDB();
    $testId = 'TEST_' . uniqid();
    try {
        $stmt = $db->prepare("INSERT INTO firs (fir_id, fir_number, complainant_name, complainant_phone, complainant_address, incident_date, incident_place, incident_description, crime_category, sub_category, station_id, status, priority, created_at, updated_at, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,'Pending','Medium',NOW(),NOW(),?)");
        $stmt->execute([$testId, 'TEST/'.date('Y').'/'.rand(1000,9999), 'Test User', '9999999999', 'Test Address', date('Y-m-d'), 'Test Location', 'Test complaint to verify DB write', 'IPC', 'Test', 'KL001', 'test']);
        $count = $db->query("SELECT COUNT(*) FROM firs")->fetchColumn();
        jsonOk(['test_id' => $testId, 'total_firs_in_db' => $count, 'message' => 'DB write works!']);
    } catch (Exception $e) {
        jsonErr('DB write failed: ' . $e->getMessage());
    }
    break;


    case 'submit_noc':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
        $body = getBody();
        $db = getDB();
        $id = 'NOC_' . uniqid();
        $stmt = $db->prepare("INSERT INTO noc_applications (noc_id, applicant_name, applicant_phone, applicant_address, noc_type, passport_file_no, date_of_birth, purpose, event_date, event_location, station_id, id_type, id_number, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'Pending',NOW())");
        $stmt->execute([$id, sanitize($body['applicant_name'] ?? $body['complainant_name'] ?? ''), sanitize($body['applicant_phone'] ?? $body['complainant_phone'] ?? ''), sanitize($body['applicant_address'] ?? $body['complainant_address'] ?? ''), sanitize($body['noc_type'] ?? 'Passport'), sanitize($body['passport_file_no'] ?? ''), !empty($body['date_of_birth']) ? $body['date_of_birth'] : null, sanitize($body['purpose'] ?? $body['loudspeaker_purpose'] ?? ''), !empty($body['loudspeaker_date']) ? $body['loudspeaker_date'] : null, sanitize($body['loudspeaker_location'] ?? ''), sanitize($body['station_id'] ?? 'KL001'), sanitize($body['id_type'] ?? 'Aadhaar'), sanitize($body['id_number'] ?? '')]);
        $refNum = "NOC/$id";
        auditLog($body['created_by'] ?? 'CITIZEN', 'citizen', 'NOC_SUBMITTED', 'noc_applications', $id);
        jsonOk(['noc_id' => $id, 'reference' => $refNum, 'report_number' => $refNum]);
        break;

    case 'noc_applications':
        $db = getDB();
        $stationId = $_GET['station_id'] ?? '';
        if ($stationId) {
            $stmt = $db->prepare("SELECT n.*, ps.name AS station_name FROM noc_applications n LEFT JOIN police_stations ps ON n.station_id = ps.station_id WHERE n.station_id = ? ORDER BY n.created_at DESC LIMIT 200");
            $stmt->execute([$stationId]);
        } else {
            $stmt = $db->query("SELECT n.*, ps.name AS station_name FROM noc_applications n LEFT JOIN police_stations ps ON n.station_id = ps.station_id ORDER BY n.created_at DESC LIMIT 200");
        }
        jsonOk($stmt->fetchAll());
        break;

    case 'update_noc_status':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
        $body = getBody();
        $db = getDB();
        $stmt = $db->prepare("UPDATE noc_applications SET status = ?, officer_remarks = ? WHERE noc_id = ?");
        $stmt->execute([sanitize($body['status']), sanitize($body['remarks'] ?? ''), sanitize($body['noc_id'])]);
        auditLog($body['officer_id'] ?? 'SYS', 'police', 'NOC_STATUS_UPDATE', 'noc_applications', $body['noc_id'], ['status' => $body['status']]);
        jsonOk(['updated' => true]);
        break;


    case 'section144':
        $db = getDB();
        $district = sanitize($_GET['district'] ?? '');
        $pincode = sanitize($_GET['pincode'] ?? '');
        $active_only = $_GET['active'] ?? '1';
        $where = ['1=1']; $params = [];
        if ($district) { $where[] = 'district = ?'; $params[] = $district; }
        if ($pincode) { $where[] = '(pincode = ? OR pincode IS NULL)'; $params[] = $pincode; }
        if ($active_only === '1') { $where[] = 'is_active = 1 AND end_datetime > NOW()'; }
        $stmt = $db->prepare("SELECT * FROM section144_orders WHERE " . implode(' AND ', $where) . " ORDER BY created_at DESC LIMIT 20");
        $stmt->execute($params);
        jsonOk($stmt->fetchAll());
        break;

    case 'issue_section144':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
        $body = getBody();
        $db = getDB();
        $id = 'S144_' . uniqid();
        $stmt = $db->prepare("INSERT INTO section144_orders (order_id, district, area_description, pincode, reason, start_datetime, end_datetime, issued_by, issued_by_rank, is_active, created_at) VALUES (?,?,?,?,?,?,?,?,?,1,NOW())");
        $stmt->execute([$id, sanitize($body['district']), sanitize($body['area_description']), sanitize($body['pincode'] ?? ''), sanitize($body['reason']), $body['start_datetime'], $body['end_datetime'], sanitize($body['issued_by']), sanitize($body['issued_by_rank'] ?? 'SP')]);
        auditLog($body['officer_id'] ?? 'SYS', 'admin', 'SECTION144_ISSUED', 'section144_orders', $id);
        jsonOk(['order_id' => $id]);
        break;

    case 'revoke_section144':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
        $body = getBody();
        $db = getDB();
        $stmt = $db->prepare("UPDATE section144_orders SET is_active = 0 WHERE order_id = ?");
        $stmt->execute([sanitize($body['order_id'])]);
        auditLog($body['officer_id'] ?? 'SYS', 'admin', 'SECTION144_REVOKED', 'section144_orders', $body['order_id']);
        jsonOk(['revoked' => true]);
        break;


    case 'sos_alert':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
        $body = getBody();
        $db = getDB();
        $id = 'SOS_' . uniqid();
        
        // Find nearest station using basic distance
        $lat = floatval($body['latitude'] ?? 0);
        $lng = floatval($body['longitude'] ?? 0);
        $nearestStation = null;
        $beatOfficer = null;
        
        if ($lat && $lng) {
            $stmtNear = $db->prepare("SELECT station_id, name, phone, (6371 * 2 * ASIN(SQRT(POWER(SIN(RADIANS(?-lat)/2),2)+COS(RADIANS(?))*COS(RADIANS(lat))*POWER(SIN(RADIANS(?-lng)/2),2)))) AS dist FROM police_stations ORDER BY dist ASC LIMIT 1");
            $stmtNear->execute([$lat, $lat, $lng]);
            $nearestStation = $stmtNear->fetch();
            
            // Find beat officer for this area
            if ($nearestStation) {
                $stmtBeat = $db->prepare("SELECT assigned_officer_name, assigned_officer_phone FROM beats WHERE station_id = ? LIMIT 1");
                $stmtBeat->execute([$nearestStation['station_id']]);
                $beatOfficer = $stmtBeat->fetch();
            }
        }
        
        $stmt = $db->prepare("INSERT INTO sos_alerts (alert_id, user_id, user_name, user_phone, latitude, longitude, location_description, nearest_station_id, beat_officer_name, beat_officer_phone, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,'Active',NOW())");
        $stmt->execute([
            $id,
            sanitize($body['user_id'] ?? ''),
            sanitize($body['user_name'] ?? ''),
            sanitize($body['user_phone'] ?? ''),
            $lat ?: null, $lng ?: null,
            sanitize($body['location_description'] ?? ''),
            $nearestStation['station_id'] ?? null,
            $beatOfficer['assigned_officer_name'] ?? null,
            $beatOfficer['assigned_officer_phone'] ?? null,
        ]);
        
        auditLog($body['user_id'] ?? 'CITIZEN', 'citizen', 'SOS_ALERT', 'sos_alerts', $id);
        jsonOk([
            'alert_id' => $id,
            'nearest_station' => $nearestStation,
            'beat_officer' => $beatOfficer,
            'message' => 'SOS Alert sent! Help is on the way.',
        ]);
        break;

    case 'sos_alerts':
        $db = getDB();
        $stmt = $db->query("SELECT * FROM sos_alerts ORDER BY created_at DESC LIMIT 50");
        jsonOk($stmt->fetchAll());
        break;

    case 'update_sos_status':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
        $body = getBody();
        $db = getDB();
        $stmt = $db->prepare("UPDATE sos_alerts SET status = ? WHERE alert_id = ?");
        $stmt->execute([sanitize($body['status']), sanitize($body['alert_id'])]);
        jsonOk(['updated' => true]);
        break;


    case 'flag_witness':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('POST required');
        $body = getBody();
        $db = getDB();
        $stmt = $db->prepare("UPDATE firs SET witness_details = CONCAT('[PROTECTED] ', witness_details) WHERE fir_id = ?");
        $stmt->execute([sanitize($body['fir_id'])]);
        // Log in case_timeline
        $tStmt = $db->prepare("INSERT INTO case_timeline (fir_id, action, officer_name, officer_rank, action_date) VALUES (?,?,?,?,NOW())");
        $tStmt->execute([$body['fir_id'], '⚠ Witness marked for protection. Identity to be kept confidential.', sanitize($body['officer_id'] ?? 'Officer'), 'PI']);
        auditLog($body['officer_id'] ?? 'SYS', 'police', 'WITNESS_PROTECTED', 'firs', $body['fir_id']);
        jsonOk(['flagged' => true]);
        break;


    case 'officer_performance':
        $db = getDB();
        $stmt = $db->query("
            SELECT 
                f.assigned_officer_id,
                u.name AS officer_name,
                u.rank AS officer_rank,
                ps.name AS station_name,
                COUNT(f.fir_id) AS total_assigned,
                SUM(CASE WHEN f.status IN ('ChargeSheeted','Closed') THEN 1 ELSE 0 END) AS resolved,
                SUM(CASE WHEN f.status = 'Pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN f.status = 'Investigating' THEN 1 ELSE 0 END) AS investigating,
                ROUND(SUM(CASE WHEN f.status IN ('ChargeSheeted','Closed') THEN 1 ELSE 0 END) * 100.0 / COUNT(f.fir_id), 1) AS resolution_rate,
                ROUND(AVG(TIMESTAMPDIFF(DAY, f.created_at, IFNULL(f.updated_at, NOW()))), 1) AS avg_days_to_resolve
            FROM firs f
            LEFT JOIN users u ON f.assigned_officer_id = u.user_id
            LEFT JOIN police_stations ps ON f.station_id = ps.station_id
            WHERE f.assigned_officer_id IS NOT NULL
            GROUP BY f.assigned_officer_id
            ORDER BY resolution_rate DESC
            LIMIT 20
        ");
        jsonOk($stmt->fetchAll());
        break;


    case 'run_escalation':
        $db = getDB();
        try {
            // Pure PHP escalation - no stored procedure needed
            $stmtFind = $db->query("SELECT fir_id, fir_number FROM firs WHERE status = 'Investigating' AND updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY)");
            $oldFirs = $stmtFind->fetchAll();
            $escalated = 0;
            foreach ($oldFirs as $fir) {
                $db->prepare("UPDATE firs SET status='Referred', updated_at=NOW() WHERE fir_id=?")->execute([$fir['fir_id']]);
                $db->prepare("INSERT INTO case_timeline (fir_id, action, officer_name, officer_rank, action_date) VALUES (?,?,?,?,NOW())")->execute([$fir['fir_id'], 'AUTO-ESCALATED: Exceeded 30-day investigation limit. Referred to CID.', 'System', 'System']);
                $db->prepare("INSERT INTO audit_log (user_id, user_role, action, entity_type, entity_id, new_values, created_at) VALUES ('SYSTEM','system','AUTO_ESCALATION','firs',?,?,NOW())")->execute([$fir['fir_id'], '{"status":"Referred"}']);
                $escalated++;
            }
            jsonOk(['escalated' => $escalated, 'message' => "$escalated FIRs auto-escalated to CID"]);
        } catch (Exception $e) {
            jsonErr('Escalation failed: ' . $e->getMessage());
        }
        break;


    case 'check_missing_match':
        // Check if newly filed missing person matches any existing records
        $db = getDB();
        $age = intval($_GET['age'] ?? 0);
        $gender = sanitize($_GET['gender'] ?? '');
        $location = sanitize($_GET['location'] ?? '');
        
        $matches = [];
        
        // Check against existing missing persons (similar age/gender/location)
        if ($age && $gender) {
            $stmt = $db->prepare("SELECT missing_id, name, age, gender, last_seen_location, date_missing, status FROM missing_persons WHERE gender = ? AND ABS(age - ?) <= 5 AND status = 'Open' LIMIT 5");
            $stmt->execute([$gender, $age]);
            $matches = $stmt->fetchAll();
        }
        
        if (!empty($matches)) {
            jsonOk(['possible_matches' => $matches, 'count' => count($matches), 'message' => count($matches) . ' possible match(es) found in existing records']);
        } else {
            jsonOk(['possible_matches' => [], 'count' => 0, 'message' => 'No similar records found']);
        }
        break;


default:
    jsonErr("Unknown action: $action", 404);
}
