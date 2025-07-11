-- delete al previous data
DROP TABLE 			IF EXISTS FRIENDS; -- delete BEFORE users
DROP TABLE 			IF EXISTS MESSAGES;-- delete BEFORE users
DROP TABLE 			IF EXISTS USERS;

DROP PROCEDURE 	IF EXISTS ADD_USER;
DROP PROCEDURE 	IF EXISTS DEL_USER;
DROP FUNCTION 	IF EXISTS AUTHENTICATE;

DROP PROCEDURE 	IF EXISTS ADD_MESSAGE;
DROP PROCEDURE 	IF EXISTS DEL_MESSAGE;
DROP FUNCTION	IF EXISTS GET_CHATS;

DROP PROCEDURE 	IF EXISTS ADD_FRIEND;
DROP PROCEDURE 	IF EXISTS DEL_FRIEND;
DROP PROCEDURE 	IF EXISTS APPROVE_FRIEND;
DROP FUNCTION	IF EXISTS GET_FRIENDS;


-- create tables
CREATE TABLE USERS (
	user_id				SERIAL			NOT NULL	PRIMARY KEY,
	username			VARCHAR(32)		NOT NULL	UNIQUE,
	password			VARCHAR(32)		NOT NULL,
	user_created_at		TIMESTAMP		NOT NULL	DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE MESSAGES (
	message_id		SERIAL			NOT NULL	PRIMARY KEY,
	message_text	varchar(1000)	NOT NULL,
	sent_at			TIMESTAMP		NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	sender_id		INT				NOT NULL	REFERENCES USERS(USER_ID),
	recever_id		INT				NOT NULL	REFERENCES USERS(USER_ID)
);

CREATE TABLE FRIENDS (
	friend1				INT			NOT NULL	REFERENCES USERS(USER_ID),
	friend2				INT			NOT NULL	REFERENCES USERS(USER_ID),
	request_accepted	BOOLEAN		NOT NULL	DEFAULT FALSE
);


-- user procedures

-- CALL AUTHENTICATE('<username>', '<password>')
CREATE FUNCTION AUTHENTICATE (p_username VARCHAR, p_password VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
	RETURN EXISTS (
		SELECT 1 FROM USERS
		WHERE username = p_username AND password = p_password
	);
END;
$$;


-- CALL ADD_USER('<username>', '<password>')
CREATE PROCEDURE ADD_USER (p_username VARCHAR, p_password VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
	INSERT INTO USERS (username, password)
		VALUES (p_username, p_password);
END;
$$;


-- CALL DEL_USER(<user_id>)
CREATE PROCEDURE DEL_USER (p_user_id INT, p_password VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM USERS
    WHERE user_id = p_user_id AND password = p_password;
END;
$$;


-- message procedures

-- CALL NEW_MESSAGE('<message_text>', sender_id, recever_id)
CREATE PROCEDURE ADD_MESSAGE (p_message_text VARCHAR, p_sender_id INT, p_recever_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
	INSERT INTO MESSAGES (message_text, sender_id, recever_id)
		VALUES (p_message_text, p_sender_id, p_recever_id);
END;
$$;


-- CALL DEL_MESSAGE(<message_id>, <sender_id>)
CREATE PROCEDURE DEL_MESSAGE (p_message_id INT, p_user_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
	DELETE FROM MESSAGES
		WHERE (sender_id = p_user_id AND message_id = p_message_id);
END;
$$;

-- SELECT * FROM GET_CHATS(<user_id>)
CREATE FUNCTION GET_CHATS (p_user_id INT)
RETURNS SETOF MESSAGES
LANGUAGE plpgsql
AS $$
BEGIN
	RETURN QUERY SELECT * FROM MESSAGES
	WHERE (p_user_id = sender_id OR p_user_id = recever_id);
END;
$$;


-- friend procedures

-- CALL ADD_FRIEND(<friend1_id>, <friend2_id>)
CREATE PROCEDURE ADD_FRIEND (p_friend1_id INT, p_friend2_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
	INSERT INTO FRIENDS (friend1, friend2)
		VALUES (p_friend1_id, p_friend2_id);
END;
$$;


-- CALL DEL_FRIEND(<friend1_id>, <friend2_id>)
CREATE PROCEDURE DEL_FRIEND (p_friend1_id INT, p_friend2_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
	DELETE FROM FRIENDS
	WHERE (friend1 = p_friend1_id AND friend2 = p_friend2_id) OR
		(friend2 = p_friend1_id AND friend1 = p_friend2_id);
END;
$$;


-- CALL APPROVE_FRIEND(<friend1_id>, <friend2_id>)
CREATE PROCEDURE APPROVE_FRIEND (p_friend1_id INT, p_friend2_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
	UPDATE FRIENDS SET request_accepted = True
	WHERE (friend1 = p_friend1_id AND friend2 = p_friend2_id) OR
		(friend2 = p_friend1_id AND friend1 = p_friend2_id);
END;
$$;

-- SELECT * FROM GET_FRIENDS(<user_id>)
CREATE FUNCTION GET_FRIENDS (p_user_id INT)
RETURNS TABLE (
    username            VARCHAR,
    request_accepted    BOOL,
    user_id             INT
)
LANGUAGE plpgsql
AS $$
BEGIN
	RETURN QUERY SELECT u.username AS username, f.request_accepted AS request_accepted,
		CASE WHEN p_user_id = f.friend1 THEN f.friend2 ELSE f.friend1 END AS user_id FROM FRIENDS f
    JOIN USERS u ON (u.user_id = CASE WHEN p_user_id = f.friend1 THEN f.friend2 ELSE f.friend1 END)
    WHERE (p_user_id = f.friend1 OR p_user_id = f.friend2);
END;
$$;
