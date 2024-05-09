#!/bin/bash
set -e
echo "dirname : [$(dirname "$0")]"
rm -rf ../Frontend/dist/*
rm -rf ../../Public/*
parcel build ../Frontend/src/index.html --dist-dir ../../Public --no-cache
cp ../riveassets/* ../../Public/.
