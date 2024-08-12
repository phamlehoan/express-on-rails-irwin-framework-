rm -rf db/migrate/compiled
mkdir db/migrate/compiled
touch db/migrate/compiled/.keep
npx tsc -p db/migrate --outDir db/migrate/compiled
npx sequelize db:migrate