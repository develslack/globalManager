USE `global_manager_db`;

DELIMITER //

-- 1. Get by Name
DROP PROCEDURE IF EXISTS `sp_gm_roles_get_by_description` //
CREATE PROCEDURE `sp_gm_roles_get_by_description`(IN p_role_description VARCHAR(128))
BEGIN
    SELECT * FROM `gm_roles` where role_description = p_role_description LIMIT 1;
END //

-- 2. Get by ID
DROP PROCEDURE IF EXISTS `sp_gm_roles_get_by_id` //
CREATE PROCEDURE `sp_gm_roles_get_by_id`(IN p_id INT)
BEGIN
    SELECT * FROM `gm_roles` where id = p_id LIMIT 1;
END //

-- 3. Check if Exists (Name or Email)
DROP PROCEDURE IF EXISTS `sp_gm_roles_check_exists` //
CREATE PROCEDURE `sp_gm_roles_check_exists`(IN p_role_description VARCHAR(128))
BEGIN
    SELECT COUNT(*) FROM `gm_roles` WHERE role_description = p_role_description;
END //

-- 4. Register New
DROP PROCEDURE IF EXISTS `sp_gm_roles_register` //
CREATE PROCEDURE `sp_gm_roles_register`(
    IN p_role_description VARCHAR(128)
)
BEGIN
    INSERT INTO `gm_roles` (role_description)
    VALUES (p_role_description);

    SELECT LAST_INSERT_ID() AS id;
END //


-- 5. Update Role
DROP PROCEDURE IF EXISTS `sp_gm_role_update` //
CREATE PROCEDURE `sp_gm_role_update`(IN p_id INT, IN p_role_descriptoin VARCHAR(128))
BEGIN
    UPDATE `gm_roles` SET role_description = p_role_description WHERE id = p_id;
END //

-- 6. Get All
DROP PROCEDURE IF EXISTS `sp_gm_roles_get_all` //
CREATE PROCEDURE `sp_gm_roles_get_all`()
BEGIN
    SELECT id, role_description FROM `gm_roles`;
END //



DELIMITER ;
