## VisFlow - Web-based Workflow Framework for Visual Analytics of Tabular Data

VisFlow is a tool that enables creation of visual analytics system for tabular data based on flow diagram editing.
This tool works as a user end application and makes transparent the underlying work of data processing, filtering and rendering.

For detailed introduction, refer to the system documentation.

### Installation
VisFlow requires MySQL.
Data and diagram paths can be set in _server/config.php_.
```php
<?php

$base_path = '/data/visflow/';
$data_path = 'data/';
$diagram_path = 'diagrams/';

?>
```

The following initializes the DB and the demo data and diagrams.
```bash
cd server
# creates the database and tables
# [caution] this will clear all existing tables!
mysql -u root -p < init-db.sql
# create data and diagrams folders and copy demo data and diagrams in place
./init.sh
```

It might be necessary that the web server needs permission to write to the data and diagram paths.
```bash
# pervasive permission
chmod -R 777 /data/visflow
# alternatively
chown -R www-data:www-data /data/visflow
```
Separate access control may be desired over _/data/visflow_.
