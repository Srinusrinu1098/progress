const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "twitterClone.db");
let db = null;
const initializeDbToServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server successfully running at: http://localhost:3000/");
    });
  } catch (e) {
    console.log(`db Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDbToServer();

const authorization = (request, response, next) => {
  let jwt;
  const auth = request.headers["authorization"];
  if (auth !== undefined) {
    jwt = auth.split(" ")[1];
  }
  if (jwt !== undefined) {
    jwtToken.verify(jwt, "SRINU1098@", async (error, playLoad) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }
};

// post

app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const checkUser = `
    SELECT * FROM user WHERE username = "${username}";`;
  const CheckValidUser = await db.get(checkUser);
  console.log(CheckValidUser);
  if (CheckValidUser == undefined) {
    if (password.length >= 6) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const PushTheBodyDetailsToDb = `
            INSERT INTO user(username,password,name,gender) VALUES ('${username}','${hashedPassword}','${name}','${gender}');`;
      const dbResponse = await db.run(PushTheBodyDetailsToDb);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// post and get twitter

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const checkTwitterIdOfUser = `
    SELECT * FROM tweet INNER JOIN user ON tweet.user_id = user.user_id WHERE username = '${username}';`;
  const checkTwitterId = await db.get(checkTwitterIdOfUser);
  if (checkTwitterId !== undefined) {
    const compareHashedPassword = await bcrypt.compare(
      password,
      checkTwitterId.password
    );
    if (compareHashedPassword == true) {
      const playLoad = {
        username: username,
      };
      const jwtToken = jwt.sign(playLoad, "SRINU1098@");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

// get
app.get("/user/tweets/feed/", async (request, response) => {
  const getTweets = `
    SELECT user.username AS username ,tweet.tweet,tweet.date_time AS dateTime FROM tweet INNER JOIN user ON tweet.user_id = user.user_id GROUP BY username ORDER BY date_time ASC LIMIT 4 ;`;
  const getTheTweetsOf4 = await db.all(getTweets);
  response.send(getTheTweetsOf4);
});

// get people following
app.get("/user/following/", async (request, response) => {
  const getPeople = `
    SELECT user.username AS name FROM follower INNER JOIN user ON follower.following_user_id = user.user_id GROUP BY user.username;`;
  const getPeopleNames = await db.all(getPeople);
  response.send(getPeopleNames);
});

// get  people follower
app.get("/user/followers/", async (request, response) => {
  const getPeople = `
    SELECT user.username AS name FROM follower INNER JOIN user ON follower.follower_user_id = user.user_id GROUP BY user.username;`;
  const getPeopleNames = await db.all(getPeople);
  response.send(getPeopleNames);
});
