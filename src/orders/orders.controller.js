const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");
let errors = [];

function orderExists(req, res, next) {
  const { orderId } = req.params;
  let foundOrder = orders.find((order) => order.id == Number(orderId));
  res.locals.foundOrder = foundOrder;
  if (foundOrder) {
    next();
  } else {
    next({ status: 404, message: `Order ID not found: ${orderId}` });
  }
}
/**CREATE
 *
 */
function hasAddress(req, res, next) {
  if (req.body.data.deliverTo == "" || !req.body.data.deliverTo) {
    errors.push("Order must include a deliverTo");
  }
  next();
}
function hasMobile(req, res, next) {
  if (req.body.data.mobileNumber == "" || !req.body.data.mobileNumber) {
    errors.push("Order must include a mobileNumber");
  }
  next();
}
function hasDishes(req, res, next) {
  if (!Array.isArray(req.body.data.dishes)) {
    errors.push("Order must include a dish");
  }
  next();
}
function isFilledArray(req, res, next) {
  if (!Array.isArray(req.body.data.dishes) || req.body.data.dishes.length < 1) {
    errors.push("Order must include at least one dish");
  }
  next();
}
function dishQuantityCheck(req, res, next) {
  const dishes = req.body.data.dishes;
  if (Array.isArray(req.body.data.dishes)) {
    for (index = 0; index < dishes.length; index++) {
      if (
        !dishes[index].quantity ||
        dishes[index].quantity < 1 ||
        !Number.isInteger(dishes[index].quantity)
      ) {
        errors.push(
          `Dish ${index} must have a quantity that is an integer greater than 0`
        );
      }
    }
  } else {
    errors.push("Order must include a dish");
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
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status ? status : "pending",
    dishes: dishes,
  };

  orders.push(newOrder);
  res.status(201);
  res.json({ data: newOrder });
}
/**
 * READ
 */
function list(req, res, next) {
  res.json({ data: orders });
}
function read(req, res, next) {
  res.json({ data: res.locals.foundOrder });
}
/**
 * UPDATE
 */
function hasValidStatus(req, res, next) {
  if (
    req.body.data.status == "" ||
    !req.body.data.status ||
    req.body.data.status == "invalid"
  ) {
    errors.push(
      "Order must have a status of pending, preparing, out-for-delivery, delivered"
    );
  }
  if (req.body.data.status === "delivered") {
    errors.push("A delivered order cannot be changed");
  }
  next();
}
function idCheck(req, res, next) {
  const { orderId } = req.params;
  const { id } = req.body.data;

  if (id) {
    if (orderId !== id) {
      errors.push(
        `Order id does not match route id. Order: ${id}, Route: ${orderId}`
      );
    }
  }
  next();
}
function update(req, res, next) {
  foundOrder = res.locals.foundOrder;
  originalOrder = foundOrder;
  const updatedOrder = {
    id: foundOrder.id,
    deliverTo: req.body.data.deliverTo,
    mobileNumber: req.body.data.mobileNumber,
    status: req.body.data.status,
    dishes: [...req.body.data.dishes],
  };
  foundOrder = updatedOrder;
  res.json({ data: foundOrder });
}
/**
 * DELETE
 */
function hasPendingStatus(req, res, next) {
  if (res.locals.foundOrder.status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}
function destroy(req, res, next) {
  const index = orders.indexOf(res.locals.foundOrder);
  orders.splice(index, 1);
  res.sendStatus(204);
}
module.exports = {
  list,
  create: [
    hasAddress,
    hasMobile,
    hasDishes,
    isFilledArray,
    dishQuantityCheck,
    errorCheck,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    hasValidStatus,
    idCheck,
    hasAddress,
    hasMobile,
    hasDishes,
    isFilledArray,
    dishQuantityCheck,
    errorCheck,
    update,
  ],
  delete: [orderExists, hasPendingStatus, destroy],
};
