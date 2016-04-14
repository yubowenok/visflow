DROP DATABASE IF EXISTS visflow;
CREATE DATABASE visflow;
USE visflow;

GRANT ALL PRIVILEGES ON visflow.* TO visflow@localhost;
DROP USER visflow@localhost;
CREATE USER visflow@localhost IDENTIFIED BY 'visflow';
GRANT ALL PRIVILEGES ON visflow.* TO visflow@localhost;

DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS data;

CREATE TABLE user (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(32) NOT NULL,
  password CHAR(64) NOT NULL,
  email VARCHAR(256) NOT NULL,
  register_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  session_id CHAR(64) NOT NULL,
  start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP NOT NULL,
  CONSTRAINT FOREIGN KEY (user_id)
    REFERENCES visflow.user (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE visit (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id CHAR(64) NOT NULL,
  ip VARCHAR(40) NOT NULL,
  time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  url VARCHAR(128)
);

CREATE TABLE data (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(256) NOT NULL,
  file_name VARCHAR(256) NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  upload_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  size INT UNSIGNED NOT NULL,
  public BOOL DEFAULT false,
  CONSTRAINT uniq_user_data UNIQUE (user_id, file_name),
  CONSTRAINT FOREIGN KEY (user_id)
    REFERENCES visflow.user (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE diagram (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(256) NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  public BOOL DEFAULT false,
  CONSTRAINT uniq_user_diagram UNIQUE (user_id, name),
  CONSTRAINT FOREIGN KEY (user_id)
    REFERENCES visflow.user (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE share_diagram (
  diagram_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (diagram_id, user_id),
  CONSTRAINT FOREIGN KEY (diagram_id)
    REFERENCES visflow.diagram (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (USER_id)
    REFERENCES visflow.user (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE share_data (
  data_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (data_id, user_id),
  CONSTRAINT FOREIGN KEY (data_id)
    REFERENCES visflow.data (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT FOREIGN KEY (USER_id)
    REFERENCES visflow.user (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE sample_data (
  data_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (data_id),
  CONSTRAINT FOREIGN KEY (data_id)
    REFERENCES visflow.data (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

INSERT INTO user (username, password, email) VALUES
  ('visflow', 'ec975f0ba679cebcfabb0b023893850202ac0f5a9533a25a3fc5e6c2f0fe1cab', 'visflow.nyu@gmail.com'),
  ('demo', '2a97516c354b68848cdbd8f54a226a0a55b21ed138e207ad6c5cbb9c00aa5aea', 'visflow.nyu@gmail.com');

INSERT INTO data (user_id, name, file_name, file_path, size) VALUES
  (1, 'car', 'car.csv', 'data/visflow/car.csv', 21372),
  (2, 'car', 'car.csv', 'data/demo/car.csv', 21372),
  (2, 'car (mds)', 'car_mds.csv', 'data/demo/car_mds.csv', 50429),
  (2, 'network nodes', 'regnet_nodes.csv', 'data/demo/regnet_nodes.csv', 21335),
  (2, 'network edges', 'regnet_edges.csv', 'data/demo/regnet_edges.csv', 123461),
  (2, 'expression matrix', 'rnaseq.csv', 'data/demo/rnaseq.csv', 67284);

INSERT INTO diagram (user_id, name, file_path) VALUES
  (2, 'myDiagram', 'diagrams/demo/myDiagram'),
  (2, 'network', 'diagrams/demo/network');

INSERT INTO sample_data (data_id) VALUES (1);
