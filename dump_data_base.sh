#!/bin/bash
fecha=`date +%d-%m-%Y`
archivo="backend/sql/dumps/global_manager_db-$fecha.sql"
mysqldump --user=root --password=slack142 --host=localhost --routines --triggers global_manager_db > $archivo
chmod 777 $archivo



