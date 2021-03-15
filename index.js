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

    if (process.env.DONT_DELETE_EXISTING_TABLE !== "true") {
      await pool.query("delete from dummy_data");
      console.log("data deleted");
    } else {
      console.log("not deleting data");
    }
  } catch (e) {
    console.log(e);
  }
};

let tasksDone = 0;

const generateTasks = (numTasks) => {
  const dummyData = {};
  console.log("generating blob with size: ", process.env.JSON_SIZE || 20000);
  for (var j = 0; j < (process.env.JSON_SIZE || 20000); j++) {
    dummyData[Math.random().toString()] = Math.random().toString();
  }

  console.log("done generating blob");

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
  async.parallelLimit(tasks, process.env.PARALLEL_LIMIT || 15, () => {
    console.log("all done with inserts");
  });
};

const main = async () => {
  await init();
  const tasks = generateTasks(process.env.NUM_TASKS || 800);
  console.log("generated tasks");
  fillData(tasks);
};

main();
