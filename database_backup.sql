PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE user_saves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            place_id TEXT NOT NULL,
            saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (place_id) REFERENCES saved_locations (place_id)
        );
INSERT INTO user_saves VALUES(104,'28','ChIJI_N7G8m_woARJliayH3N0RY','2025-08-08 02:21:45');
INSERT INTO user_saves VALUES(105,'28','ChIJ8db9TV4E9YgRTCfS7R0zEK4','2025-08-08 02:26:02');
INSERT INTO user_saves VALUES(106,'28','ChIJKZEIXIq3t4kRB2RlVmrztoY','2025-08-08 02:31:27');
INSERT INTO user_saves VALUES(107,'28','ChIJdXUZerRZwokRA3hc103YZNM','2025-08-08 02:38:25');
INSERT INTO user_saves VALUES(108,'28','ChIJ7cv00DwsDogRAMDACa2m4K8','2025-08-08 02:43:37');
INSERT INTO user_saves VALUES(109,'28','ChIJGzE9DS1l44kRoOhiASS_fHg','2025-08-08 02:44:48');
INSERT INTO user_saves VALUES(110,'28','ChIJgRo4_MQfVIgRZNFDv-ZQRog','2025-08-08 02:45:45');
INSERT INTO user_saves VALUES(111,'28','ChIJS5dFe_cZTIYRj2dH9qSb7Lk','2025-08-08 02:49:55');
INSERT INTO user_saves VALUES(112,'28','ChIJAYWNSLS4QIYROwVl894CDco','2025-08-08 02:51:15');
INSERT INTO user_saves VALUES(113,'28','ChIJEcHIDqKw2YgRZU-t3XHylv8','2025-08-08 02:53:11');
INSERT INTO user_saves VALUES(114,'28','ChIJpTvG15DL1IkRd8S0KlBVNTI','2025-08-08 02:54:32');
INSERT INTO user_saves VALUES(115,'28','ChIJIQBpAG2ahYAR_6128GcTUEo','2025-08-08 12:38:41');
INSERT INTO user_saves VALUES(116,'28','ChIJzxcfI6qAa4cR1jaKJ_j0jhE','2025-08-08 12:39:44');
CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            reset_token TEXT,
            reset_token_expires DATETIME
        , email_verified BOOLEAN DEFAULT 0, verification_token TEXT, verification_token_expires DATETIME, is_admin BOOLEAN DEFAULT 0, gps_permission TEXT DEFAULT 'not_asked', gps_permission_updated DATETIME);
INSERT INTO users VALUES(28,'rodczaro@gmail.com','rodczaro@gmail.com','$2a$12$LKkOVX48EXCzJikz6TtJUuOY5E9NpRFSw6HCPluy8vty3X1xvlNhW','Richard','Griola','2025-08-08 02:00:10','2025-08-08 02:05:05',1,NULL,NULL,1,NULL,NULL,1,'granted','2025-08-08 02:10:03');
INSERT INTO users VALUES(29,'jono','shanachie@gmail.com','$2a$12$GHB.aMOux6iwglICxHgzbuKfBNBzax9FtbVZUeCIS4xR8Wv3cNre.','Jon','Obeirne','2025-08-08 13:24:45','2025-08-08 13:24:45',1,NULL,NULL,1,NULL,NULL,0,'not_asked',NULL);
CREATE TABLE user_sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        session_token TEXT UNIQUE NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
                        expires_at DATETIME NOT NULL,
                        user_agent TEXT,
                        ip_address TEXT,
                        is_active BOOLEAN DEFAULT 1,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    );
INSERT INTO user_sessions VALUES(240,28,'d24ae708553392548dd4ce44be13ad0ffd6fa16f281ab2c74a247bf56bbd3645','2025-08-08 13:47:24','2025-08-08 13:47:24','2025-08-09T13:47:24.202Z','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','::1',1);
CREATE TABLE location_photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                place_id TEXT NOT NULL,
                user_id INTEGER,
                imagekit_file_id TEXT UNIQUE NOT NULL,
                imagekit_file_path TEXT NOT NULL,
                original_filename TEXT,
                file_size INTEGER,
                mime_type TEXT,
                width INTEGER,
                height INTEGER,
                is_primary BOOLEAN DEFAULT FALSE,
                caption TEXT,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (place_id) REFERENCES saved_locations (place_id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
CREATE TABLE IF NOT EXISTS "saved_locations" (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        lat REAL NOT NULL,
                        lng REAL NOT NULL,
                        formatted_address TEXT,
                        production_notes TEXT CHECK(length(production_notes) <= 200),
                        type TEXT NOT NULL CHECK(type IN (
                          'broll', 'interview', 'live anchor', 'live reporter', 'stakeout',
                          'headquarters', 'bureau', 'office'
                        )),
                        entry_point TEXT CHECK(entry_point IN ('front door', 'backdoor', 'garage', 'parking lot')),
                        parking TEXT CHECK(parking IN ('street', 'driveway', 'garage')),
                        access TEXT CHECK(access IN ('ramp', 'stairs only', 'doorway', 'garage')),
                        street TEXT,
                        number TEXT,
                        city TEXT,
                        state TEXT CHECK(length(state) <= 2),
                        zipcode TEXT CHECK(length(zipcode) <= 5),
                        created_by INTEGER NOT NULL,
                        created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        place_id TEXT UNIQUE NOT NULL,
                        is_permanent BOOLEAN DEFAULT FALSE, imagekit_file_id TEXT, imagekit_file_path TEXT, original_filename TEXT, photo_uploaded_by INTEGER, photo_uploaded_at DATETIME, photo_urls TEXT DEFAULT '[]',
                        
                        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
                    );
INSERT INTO saved_locations VALUES(104,'CNN Los Angeles',34.14854580000000083,-118.335967199999999,'Burbank, CA, USA','Enter through production gate.','bureau','front door','garage','garage','','','Burbank','CA','',28,'2025-08-08 02:21:45','2025-08-08 13:14:53','ChIJI_N7G8m_woARJliayH3N0RY',1,NULL,NULL,NULL,NULL,NULL,'[]');
INSERT INTO saved_locations VALUES(105,'CNN Atlanta - Earth Station ',33.7827612999999971,-84.39236300000001734,'1050 Techwood Drive Northwest, Atlanta, GA 30318, USA','Enter 14th Street NW & Holly NW.  This leads to security and garage.','bureau','backdoor','garage','garage','Techwood Drive Northwest','1050','Atlanta','GA','30318',28,'2025-08-08 02:26:02','2025-08-08 13:22:23','ChIJ8db9TV4E9YgRTCfS7R0zEK4',1,NULL,NULL,NULL,NULL,NULL,'[]');
INSERT INTO saved_locations VALUES(106,'CNN Washington',38.90084520510524869,-77.00655137606146639,'840 First Street Northeast, Washington, DC 20002, USA','This is the best location to walk in. Parking is in the garage to the left of this entrance. The parking garage is restricted to CNN passes only.','bureau','front door','garage','garage','First Street Northeast','840','Washington','DC','20002',28,'2025-08-08 02:31:27','2025-08-08 13:22:26','ChIJKZEIXIq3t4kRB2RlVmrztoY',1,NULL,NULL,NULL,NULL,NULL,'[]');
INSERT INTO saved_locations VALUES(107,'CNN New York - CNN Global HQ',40.75449639747422736,-74.0011342700843926,'537 West 33rd Street, New York, NY 10001, USA','Best spot for pickup/drop off. There is space to pull over and sit. Offices are inside HY. Look for the Blue Lane Coffee.   If bringing gear there is parking in the loadingdock.','headquarters','front door','street','doorway','West 33rd Street','537','New York','NY','10001',28,'2025-08-08 02:38:25','2025-08-08 13:22:30','ChIJdXUZerRZwokRA3hc103YZNM',1,NULL,NULL,NULL,NULL,NULL,'[]');
INSERT INTO saved_locations VALUES(108,'CNN Chicago',41.88324999999999675,-87.63238789999999768,'Chicago, IL, USA','CNN Staffers','office','front door','street','doorway','','','Chicago','IL','',28,'2025-08-08 02:43:37','2025-08-08 13:22:34','ChIJ7cv00DwsDogRAMDACa2m4K8',1,NULL,NULL,NULL,NULL,NULL,'[]');
INSERT INTO saved_locations VALUES(109,'CNN Boston',42.35550760000000282,-71.05653639999999883,'Boston, MA, USA','Bob Crowley is the Boston Chief of Station','office','front door','driveway','doorway','','','Boston','MA','',28,'2025-08-08 02:44:48','2025-08-08 13:22:37','ChIJGzE9DS1l44kRoOhiASS_fHg',1,NULL,NULL,NULL,NULL,NULL,'[]');
INSERT INTO saved_locations VALUES(110,'CNN Charlotte',35.22155479999999983,-80.84011599999999475,'Charlotte, NC, USA','Andy Buck is Chief of Station','office','front door','driveway','doorway','','','Charlotte','NC','',28,'2025-08-08 02:45:45','2025-08-08 13:22:41','ChIJgRo4_MQfVIgRZNFDv-ZQRog',1,NULL,NULL,NULL,NULL,NULL,'[]');
INSERT INTO saved_locations VALUES(111,'CNN Dallas',32.77666419999999903,-96.7969878999999906,'Dallas, TX, USA','Everyone is WFH.  Five Staffers','office','front door','street','garage','','','Dallas','TX','',28,'2025-08-08 02:49:55','2025-08-08 13:22:45','ChIJS5dFe_cZTIYRj2dH9qSb7Lk',1,NULL,NULL,NULL,NULL,NULL,'[]');
INSERT INTO saved_locations VALUES(112,'CNN Houston',29.76007710000000017,-95.3701107999999919,'Houston, TX, USA','Three staffers in Houston, all WFH','office','front door','street','garage','','','Houston','TX','',28,'2025-08-08 02:51:15','2025-08-08 13:22:48','ChIJAYWNSLS4QIYROwVl894CDco',1,NULL,NULL,NULL,NULL,NULL,'[]');
INSERT INTO saved_locations VALUES(113,'CNN Miami',25.76167979999999958,-80.1917901999999998,'Miami, FL, USA','All staffers WFH.','office','front door','street','garage','','','Miami','FL','',28,'2025-08-08 02:53:11','2025-08-08 13:22:53','ChIJEcHIDqKw2YgRZU-t3XHylv8',1,NULL,NULL,NULL,NULL,NULL,'[]');
INSERT INTO saved_locations VALUES(114,'CNN Canada - Toronto',43.65322599999999653,-79.38318429999999637,'Toronto, ON, USA','Paula Newton''s homebase is Toronto. She is CNN International','office','front door','driveway','doorway','','','Toronto','ON','',28,'2025-08-08 02:54:32','2025-08-08 13:23:03','ChIJpTvG15DL1IkRd8S0KlBVNTI',1,NULL,NULL,NULL,NULL,NULL,'[]');
INSERT INTO saved_locations VALUES(115,'CNN San Francisco',37.77492949999999894,-122.4194154999999995,'San Francisco, CA, USA','Staff is WFH, Jim Castel and Todd Anderson hold down this station.','office','front door','garage','garage','','','San Francisco','CA','',28,'2025-08-08 12:38:41','2025-08-08 13:23:00','ChIJIQBpAG2ahYAR_6128GcTUEo',1,NULL,NULL,NULL,NULL,NULL,'[]');
INSERT INTO saved_locations VALUES(116,'CNN Denver',39.739235800000003,-104.9902510000000006,'Denver, CO, USA','Staff is WFH. Ken Tillis is Chief of Station','office','front door','driveway','doorway','','','Denver','CO','',28,'2025-08-08 12:39:44','2025-08-08 13:22:57','ChIJzxcfI6qAa4cR1jaKJ_j0jhE',1,NULL,NULL,NULL,NULL,NULL,'[]');
INSERT INTO saved_locations VALUES(117,'Test Regular Location',34.05219999999999914,-118.243700000000004,'123 Test Street, Los Angeles, CA',NULL,'broll',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,29,'2025-08-08 13:39:58','2025-08-08 13:39:58','test_location_123',0,NULL,NULL,NULL,NULL,NULL,'[]');
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('user_saves',116);
INSERT INTO sqlite_sequence VALUES('users',29);
INSERT INTO sqlite_sequence VALUES('user_sessions',240);
INSERT INTO sqlite_sequence VALUES('location_photos',18);
INSERT INTO sqlite_sequence VALUES('saved_locations',117);
CREATE INDEX idx_saved_locations_created_by ON saved_locations(created_by);
CREATE INDEX idx_saved_locations_permanent ON saved_locations(is_permanent);
CREATE INDEX idx_saved_locations_type ON saved_locations(type);
CREATE INDEX idx_saved_locations_place_id ON saved_locations(place_id);
CREATE TRIGGER update_saved_locations_updated_date 
                                                AFTER UPDATE ON saved_locations
                                                FOR EACH ROW
                                                BEGIN
                                                    UPDATE saved_locations SET updated_date = CURRENT_TIMESTAMP WHERE id = NEW.id;
                                                END;
COMMIT;
