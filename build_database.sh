#!/bin/bash
#
# build_database.sh - create empty temperature database schema for to log temperature in.
#
# Tom Holderness 22/01/2012
sqlite3 piTemps.db 'DROP TABLE temperature_records;'
sqlite3 piTemps.db 'CREATE TABLE temperature_records(timestamp bigint primary key, value real, sensor_id text);'

