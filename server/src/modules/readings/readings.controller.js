const AppError = require('../../lib/AppError');
const service = require('./readings.service');

const parseId = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
    throw new AppError(400, 'Invalid reading id');
  }
  return id;
};

exports.create = async (req, res) => {
  res.status(201).json({ reading: await service.create(req.userId, req.body) });
};

exports.list = async (req, res) => {
  res.json(await service.list(req.userId, req.validated.query));
};

exports.getOne = async (req, res) => {
  res.json({ reading: await service.getOne(req.userId, parseId(req)) });
};

exports.update = async (req, res) => {
  res.json({ reading: await service.update(req.userId, parseId(req), req.body) });
};

exports.remove = async (req, res) => {
  await service.remove(req.userId, parseId(req));
  res.status(204).send();
};
