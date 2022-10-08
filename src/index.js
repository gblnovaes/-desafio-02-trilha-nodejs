const express = require('express');
const cors = require('cors');

const { v4: uuidv4, validate } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const {username} = request.headers
  
  const usernameAlreadyExists = users.some((user) => user.username === username);

  if (!usernameAlreadyExists) {
    return response.status(404).json({ error: 'User Not Exists' });      
  }
   
  const user = users.find((user) => user.username === username);
  request.user = user
  next()
}

function checksCreateTodosUserAvailability(request, response, next) {  
  const {user} = request
  
  if((user.todos.length <=9 && user.pro === false || user.pro === true)){
    next()
  }
  
  return response.status(403).json({ error: 'User Update Plan to Pro Version' });
}

function checksTodoExists(request, response, next) {
  // Complete aqui
  const {username} = request.headers
  const {id} = request.params
  
  const usernameAlreadyExists = users.some((user) => user.username === username);

  if (!usernameAlreadyExists) {
    return response.status(404).json({ error: 'User Not Exists' });      
  }
  
  const user = users.find((user) => user.username === username)
  
  const isIdTodoValid = user.todos.find((todo) => todo.id === id)
  
  
  if(!validate(id)){
    return response.status(400).json({ error: 'UUID is Invalid' })
  }
  if(!isIdTodoValid){
    return response.status(404).json({ error: 'Todo Id Invalid' })
  }
  
  if(!checkIfValidUUID(id)){
    return response.status(400).json({ error: 'Todo UUID Invalid' })
  }
  
  if( isIdTodoValid && checkIfValidUUID(id)){
    request.todo = isIdTodoValid
    request.user = user
    next()
  }else{
    return response.status(400).json({ error: 'Todo UUID Invalid' })
  }
  
  return response.status(404).json({ error: 'Todo Not Found' })
}


function checkIfValidUUID(str) {
  // Regular expression to check if string is a valid UUID
  const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

  return regexExp.test(str);
}

function findUserById(request, response, next) {
  // Complete aqui
  const {id} = request.params
  
  const userByIdAlreadyExists = users.some((user) => user.id === id);
  
  if(userByIdAlreadyExists){
    const user = users.find((user) => user.id === id)
    request.user = user
    next()
  }
  
  return response.status(404).json({ error: 'User not found' });

}

app.post('/users',(request, response) => {
  const { name, username } = request.body;
  
  const usernameAlreadyExists = users.some((user) => user.username === username);

  if (usernameAlreadyExists) {
    return response.status(400).json({ error: 'Username already exists' });
  }

  
  const user = {
    id: uuidv4(),
    name,
    username,
    pro: false,
    todos: []
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get('/users/:id', findUserById, (request, response) => {
  const { user } = request;

  return response.json(user);
});

app.patch('/users/:id/pro', findUserById, (request, response) => {
  const { user } = request;

  if (user.pro) {
    return response.status(400).json({ error: 'Pro plan is already activated.' });
  }

  user.pro = true;

  return response.json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, checksCreateTodosUserAvailability, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTodo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date()
  };

  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksTodoExists, (request, response) => {
  const { title, deadline } = request.body;
  const { todo } = request;

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);
});

app.patch('/todos/:id/done', checksTodoExists, (request, response) => {
  const { todo } = request;

  todo.done = true;

  return response.json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checksTodoExists, (request, response) => {
  const { user, todo } = request;

  const todoIndex = user.todos.indexOf(todo);

  if (todoIndex === -1) {
    return response.status(404).json({ error: 'Todo not found' });
  }

  user.todos.splice(todoIndex, 1);

  return response.status(204).send();
});

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById
};