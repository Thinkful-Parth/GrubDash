const req = require("express/lib/request");
const path = require("path");
const { resourceLimits } = require("worker_threads");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
//Error builder
let errors = [];

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id == dishId);
  if (foundDish) {
    res.locals.foundDish = foundDish;
    next();
  } else {
    next({
      status: 404,
      message: `Dish ID not found: ${dishId}`,
    });
  }
}
/**CREATE
 */
function hasName(req, res, next) {
  if (!req.body.data.name || req.body.data.name.length < 1) {
    errors.push("Dish must include a name");
  }
  next();
}
function hasDescription(req, res, next) {
  if (!req.body.data.description || req.body.data.description.length < 1) {
    errors.push("Dish must include a description");
  }
  next();
}
function hasPrice(req, res, next) {
  if (!req.body.data.price) {
    errors.push("Dish must include a price");
  }
  if (!Number.isInteger(req.body.data.price) || req.body.data.price < 0) {
    errors.push("Dish must have a price that is an integer greater than 0");
  }
  next();
}
function hasImage(req, res, next) {
  if (!req.body.data.image_url) {
    errors.push("Dish must include a image_url");
  }
  next();
}
function errorCheck(req, res, next) {
  if (errors.length > 0) {
    const string = errors && errors.join(",");
    errors = [];
    next({ status: 400, message: string });
  }
  next();
}
function create(req, res, next) {
  const newDish = {
    id: nextId(),
    name: req.body.data.name,
    description: req.body.data.description,
    price: req.body.data.price,
    image_url: req.body.data.image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

/**READ
 */
function list(req, res, next) {
  res.json({ data: dishes });
}
function read(req, res, next) {
  res.json({ data: res.locals.foundDish });
}
/** UPDATE
 *
 */
function idCheck(req, res, next) {
  const { dishId } = req.params;
  const { id } = req.body.data;
  if (id) {
    if (dishId !== id) {
      errors.push(
        `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
      );
    }
  }

  next();
}
function update(req, res, next) {
  res.locals.foundDish = {
    id: res.locals.foundDish.id,
    name: req.body.data.name,
    description: req.body.data.description,
    image_url: req.body.data.image_url,
    price: req.body.data.price,
  };

  res.json({ data: res.locals.foundDish });
}
/** DELETE
 *
 */
function destroy(req, res, next) {
  const { dishId } = req.params;
  const index = dishes.findIndex((dish) => dish.id === dishId);

  dishes.splice(index, 1);

  next({
    status: 405,
  });
}

module.exports = {
  create: [hasName, hasDescription, hasPrice, hasImage, errorCheck, create],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    idCheck,
    hasName,
    hasDescription,
    hasPrice,
    hasImage,
    errorCheck,
    update,
  ],
  delete: [destroy],
};
