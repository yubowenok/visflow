## VisFlow - Web-based Visualization Framework for Tabular Data with Subset Flow Model

[![Build Status](https://travis-ci.org/yubowenok/visflow.svg?branch=master)](https://travis-ci.org/yubowenok/visflow)

VisFlow is a web-based visualization framework that facilitates creation of interactive visualizations for tabular data based on data flow diagram editing.
VisFlow employs a [subset flow model](https://visflow.org/doc.html#fd-subset-flow-model) that features simpler data flow usage, as well as brushing and linking support for visual data exploration.
For system introduction, tutorial, and detailed usage, see the [system documentation](https://visflow.org/doc.html).

### Installation
Install VisFlow frontend:
```bash
# First make sure you have gulp and bower installed.
npm install -g gulp
npm install -g bower

# Then install dependencies at {visflow_directory}.
npm install
bower install

# Build VisFlow web and its documentation.
gulp build
gulp build-doc
```

VisFlow requires web server PHP and MySQL.
Set system paths in _{visflow_directory}/server/config_:
```txt
base_path = /data/visflow/
data_path = data/
diagram_path = diagrams/
```
The data and diagram paths are relative to the base path.
Make sure the data directory is accessible to the web server with read & write permission.

The following initializes the DB and the demo data and diagrams:
```bash
cd server
# Create the database and tables.
# [Caution] This will clear all existing tables!
mysql -u root -p < init-db.sql
# Create data and diagrams folders and copy demo data and diagrams in place.
./init.sh
```

You need to configure the web server https for VisFlow. Here is a sample config for Apache:
```
# Must have enabled rewrite_module and headers_module
<VirtualHost {your_domain}:80>
  <Directory {path_to_visflow}>
    # Redirect all http requests to https
    RewriteEngine on
    RewriteCond %{HTTPS} off
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI}
  </Directory>
</VirtualHost>
<VirtualHost {your_domain}:443>
  SSLEngine on
  SSLCertificateFile {path_to_ssl_cert}
  SSLCertificateKeyFile {path_to_ssl_key}

  <Directory {path_to_visflow}>
    DirectoryIndex index.php
  </Directory>
</VirtualHost>
```
