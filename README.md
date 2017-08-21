## VisFlow - Web-based Visualization Framework for Tabular Data with Subset Flow Model

[![Build Status](https://travis-ci.org/yubowenok/visflow.svg?branch=master)](https://travis-ci.org/yubowenok/visflow)

VisFlow is a tool that enables creation of visual analytics system for tabular data based on flow diagram editing.
This tool works as a user end application and makes transparent the underlying work of data processing, filtering and rendering.

For detailed introduction, refer to the [system documentation](https://visflow.org/doc.html).

### Installation
VisFlow requires MySQL.
Set data and diagram paths in _{visflow_directory}/server/config.php_.
The data, diagram and nlp paths are relative to the base path.
```php
<?php
$base_path = '/data/visflow/';
$data_path = 'data/';
$diagram_path = 'diagrams/';
$nlp_path = 'nlp/';
?>
```
Note that the web server needs permission to write to the data and diagram paths.
Make sure the data directory has proper access rights and are accessible to the web server.

The following initializes the DB and the demo data and diagrams.
```bash
cd server
# creates the database and tables
# [caution] this will clear all existing tables!
mysql -u root -p < init-db.sql
# create data and diagrams folders and copy demo data and diagrams in place
./init.sh
```
