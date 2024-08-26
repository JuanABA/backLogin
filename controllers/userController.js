const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const router = express.Router();
const SECRET_KEY = "your_secret_key";
var nodemailer = require("nodemailer");

// Middleware to validate JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
};

//Ruta Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });

    if (!user || !bcrypt.compareSync(password, user.contraseña)) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        edad: user.edad,
        correo: user.correo,
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

//ruta protegida para obtener la lista de usuarios
router.get("/users", authenticateJWT, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "contraseña", "nombre", "edad", "correo"],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

//Ruta para obtener un usuario por ID
router.get("/users/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id, {
      attributes: ["id", "username", "contraseña", "nombre", "edad", "correo"],
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

//Ruta para crear un usuario
router.post("/users/create", authenticateJWT, async (req, res) => {
  const { username, contraseña, nombre, edad, correo } = req.body;

  try {
    const existingUser = await User.findOne({ where: { username } });

    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = bcrypt.hashSync(contraseña, 8);

    await User.create({
      username,
      contraseña: hashedPassword,
      nombre,
      edad,
      correo,
    });

    res.status(201).json({ message: "User created successfully" });
    0;
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// Ruta para actualizar un usuario
router.put("/users/update/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { username, nombre, edad, correo } = req.body;

  try {
    const [updated] = await User.update(
      { username, nombre, edad, correo },
      { where: { id } }
    );

    if (updated === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated succesfully" });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

//Ruta para eliminar usuarios
router.delete("/users/delete/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await User.destroy({ where: { id } });

    if (deleted === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

//ruta para el forgot password
router.post("/forgot-password", async (req, res) => {
  const { correo } = req.body;

  try {
    const oldUser = await User.findOne({ where: { correo } });
    if (!oldUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const secret = SECRET_KEY + oldUser.contraseña;
    const token = jwt.sign({ correo: oldUser.correo, id: oldUser.id }, secret, {
      expiresIn: "1h",
    });
    const link = `http://localhost:5000/reset-password/${oldUser.id}/${token}`;

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "salazarjuanangel2018@gmail.com",
        pass: "etahtcnjbjacvgqw",
      },
    });

    var mailOptions = {
      from: "youremail@gmail.com",
      to: correo,
      subject: "Password reset",
      text: link,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    console.log(link);

    // Send the link as a response to the frontend
    res.status(200).json({ message: "Password reset link generated", link });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

//ruta para el reset password
router.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  console.log(req.params);

  const oldUser = await User.findOne({ where: { id } });

  if (!oldUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const secret = SECRET_KEY + oldUser.contraseña;

  try {
    const verify = jwt.verify(token, secret);

    res.render("index", { correo: verify.correo, status: "Not verified" });
  } catch (error) {
    res.send("Not verified");
  }
});

router.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { contraseña } = req.body;

  const oldUser = await User.findOne({ where: { id } });

  if (!oldUser) {
    return res.status(404).json({ message: "User not found" });
  }
  const secret = SECRET_KEY + oldUser.contraseña;
  try {
    const verify = jwt.verify(token, secret);

    const hashedPassword = bcrypt.hashSync(contraseña, 8);

    await User.update({ contraseña: hashedPassword }, { where: { id } });

    res.redirect("http://localhost:3000/login");
  } catch (error) {
    console.log(error);

    res.json({ status: "Error updating password" });
  }
});

module.exports = router;
