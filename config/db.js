const { Sequelize } = require("sequelize");

const sequilize = new Sequelize("user_management", "root", "root", {
  host: "localhost",
  dialect: "mysql",
});

sequilize
  .authenticate()
  .then(() => {
    console.log("Connection to MySQL correctly");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

module.exports = sequilize;
