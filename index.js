const { Pool } = require("pg");
const async = require("async");
const express = require("express");

// this is so that I can use this as a render web service
const app = express();
app.listen(process.env.PORT || 3000, () => {
  console.log("app listening");
});
app.get("/", (req, res) => {
  res.send("OK");
});

// connects using DATABASE_URL env var
const pool = new Pool({
  max: process.env.MAX_POOL_SIZE || 10,
  connectionString: process.env.DATABASE_URL,
});

const init = async () => {
  try {
    await pool.query("create table if not exists dummy_data(data jsonb)");
    console.log("table created");
    await pool.query("delete from dummy_data");
    console.log("data deleted");
  } catch (e) {
    console.log(e);
  }
};

let tasksDone = 0;

const generateTasks = (numTasks) => {
  const dummyData = {};
  for (var j = 0; j < process.env.JSON_SIZE || 25000; j++) {
    dummyData[Math.random().toString()] = Math.random().toString();
  }

  const tasks = [];
  for (var i = 0; i <= numTasks; i++) {
    const task = (done) => {
      pool
        .query("insert into dummy_data(data) values($1)", [dummyData])
        .then(() => {
          tasksDone++;
          if (tasksDone % 100 === 0) {
            console.log("tasks completed: ", tasksDone);
          }
          done();
        })
        .catch((e) => {
          console.log(e);
          done();
        });
    };
    tasks.push(task);
  }

  return tasks;
};

const fillData = async (tasks) => {
  async.parallelLimit(tasks, process.env.PARALLEL_LIMIT || 20, () => {
    console.log("all done with inserts");
  });
};

const main = async () => {
  await init();
  const tasks = generateTasks(process.env.NUM_TASKS || 5000);
  fillData(tasks);
};

main();
