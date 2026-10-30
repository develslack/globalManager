USE `global_manager_db`;

DELIMITER //

-- 1. Get User by Name
DROP PROCEDURE IF EXISTS `sp_gm_users_get_by_name` //
CREATE PROCEDURE `sp_gm_users_get_by_name`(IN p_name VARCHAR(128))
BEGIN
    SELECT u.id, u.name, u.email, r.description AS role
    FROM `gm_users` u
    LEFT JOIN `gm_roles` r ON u.role_id = r.id
    WHERE u.name = p_name
    LIMIT 1;
END //

-- 2. Get User by ID
DROP PROCEDURE IF EXISTS `sp_gm_users_get_by_id` //
CREATE PROCEDURE `sp_gm_users_get_by_id`(IN p_id INT)
BEGIN
    SELECT u.id, u.name, u.email, r.description AS role
    FROM `gm_users` u
    LEFT JOIN `gm_roles` r ON u.role_id = r.id
    WHERE u.id = p_id
    LIMIT 1;
END //

-- 3. Check if User Exists (Name or Email)
DROP PROCEDURE IF EXISTS `sp_gm_users_check_exists` //
CREATE PROCEDURE `sp_gm_users_check_exists`(IN p_name VARCHAR(128), IN p_email VARCHAR(128))
BEGIN
    SELECT COUNT(*) FROM `gm_users` WHERE name = p_name OR email = p_email;
END //

-- 4. Register New User
DROP PROCEDURE IF EXISTS `sp_gm_users_register` //
CREATE PROCEDURE `sp_gm_users_register`(
    IN p_name VARCHAR(128),
    IN p_email VARCHAR(128),
    IN p_password VARCHAR(128),
    IN p_role_id INT
)
BEGIN
    INSERT INTO `gm_users` (name, email, password, role_id)
    VALUES (p_name, p_email, p_password, p_role_id);

    SELECT LAST_INSERT_ID() AS id;
END //

-- 5. Check if Email Exists
DROP PROCEDURE IF EXISTS `sp_gm_users_check_email` //
CREATE PROCEDURE `sp_gm_users_check_email`(IN p_email VARCHAR(128))
BEGIN
    SELECT COUNT(*) FROM `gm_users` WHERE email = p_email;
END //

-- 6. Update Password
DROP PROCEDURE IF EXISTS `sp_gm_users_update_password` //
CREATE PROCEDURE `sp_gm_users_update_password`(
    IN p_email VARCHAR(128),
    IN p_password VARCHAR(128)
)
BEGIN
    UPDATE `gm_users` SET password = p_password WHERE email = p_email;
END //

-- 7. Update User Role
DROP PROCEDURE IF EXISTS `sp_gm_users_update_role` //
CREATE PROCEDURE `sp_gm_users_update_role`(IN p_id INT, IN p_role_id INT)
BEGIN
    UPDATE `gm_users` SET role_id = p_role_id WHERE id = p_id;
END //

-- 8. User Login
DROP PROCEDURE IF EXISTS `sp_gm_users_login` //
CREATE PROCEDURE `sp_gm_users_login`(IN p_email VARCHAR(128))
BEGIN
    SELECT id, name, email, password, role_id
    FROM `gm_users`
    WHERE email = p_email
    LIMIT 1;
END //

-- 9. Get All Users
DROP PROCEDURE IF EXISTS `sp_gm_users_get_all` //
CREATE PROCEDURE `sp_gm_users_get_all`()
BEGIN
    SELECT u.id, u.name, u.email, COALESCE(r.description, 'No Role') AS role
    FROM `gm_users` u
    LEFT JOIN `gm_roles` r ON u.role_id = r.id;
END //

-- 10. Get User Role ID
DROP PROCEDURE IF EXISTS `sp_gm_users_get_role` //
CREATE PROCEDURE `sp_gm_users_get_role`(IN p_id INT)
BEGIN
    SELECT role_id FROM `gm_users` WHERE id = p_id LIMIT 1;
END //

DELIMITER ;
