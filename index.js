const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
require('dotenv').config()
const app = express()
app.use(express.json())
app.use(express.static('dist'))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :req-body'))
morgan.token('req-body', function (req, res) { 
  if (req.method === "POST") {
    return JSON.stringify(req.body);
  }
})
app.use(cors())

const Person = require('./models/person')

let persons = [
    { 
      id: "1",
      name: "Arto Hellas", 
      number: "040-123456"
    },
    { 
      id: "2",
      name: "Ada Lovelace", 
      number: "39-44-5323523"
    },
    { 
      id: "3",
      name: "Dan Abramov", 
      number: "12-43-234345"
    },
    { 
      id: "4",
      name: "Mary Poppendieck", 
      number: "39-23-6423122"
    }
]

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

app.get('/api/persons/:id', (request, response) => {
  Person.findById(request.params.id).then(person => {
    response.json(person)
  })
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.get('/info', (request, response, next) => {
  const now = new Date();
  Person.countDocuments().then(count => { 
    response.send(`<p>Phonebook has info for ${count} people</p> <p>${now.toString()}</p>`)
  })
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (body.name === undefined) {
    return response.status(400).json({ 
      error: 'name missing' 
    })
  }

  if (body.number === undefined) {
    return response.status(400).json({ 
      error: 'number missing' 
    })
  }

  Person.findOne({ name: body.name }).then(person => {
    if (person) {
      const updatedPerson = new Person({
        name: body.name,
        number: body.number,
      })
      Person.findByIdAndUpdate(updatedPerson, { new: true })
      .then(updatedPerson => {
        response.json(updatedPerson)
      })
      .catch(error => next(error))
    }
    else {
      const newPerson = new Person({
        name: body.name,
        number: body.number,
      })

      newPerson.save()
        .then(savedPerson => {
          response.json(savedPerson)
        })
        .catch(error => next(error))
    }
  })
})

app.put('/api/persons/:id', (req, res, next) => {
  const id = req.params.id

  const entry = {
    name: req.body.name,
    number: req.body.number,
  }

  Person.findByIdAndUpdate(id, entry, { new: true })
    .then((updatedEntry) => {
      if (updatedEntry) {
        res.json(updatedEntry.toJSON())
      } else {
        res.status(404).end()
      }
    })
    .catch((error) => next(error))
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint);

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } 

  next(error)
}

// this has to be the last loaded middleware, also all the routes should be registered before this!
app.use(errorHandler)