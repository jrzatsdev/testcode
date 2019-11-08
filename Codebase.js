/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13; //var enter_key set to 13
	var ESCAPE_KEY = 27; //var escape key set to 27

	var util = { //utility object
		uuid: function () {
			/*jshint bitwise:false */
			var i, random; 
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		pluralize: function (count, word) { //method that will be used to pluralize words in the app when called
			return count === 1 ? word : word + 's'; //if the count is === to 1 do not add 's'
		},
		store: function (namespace, data) { //method that be used to store the input
			if (arguments.length > 1) { //****** need to see in action ******
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	var App = { //the app object
		init: function () { //new method called init
			this.todos = util.store('todos-jquery'); //this will store the todo in the array
			this.todoTemplate = Handlebars.compile($('#todo-template').html()); // look up
			this.footerTemplate = Handlebars.compile($('#footer-template').html()); //look up
			this.bindEvents(); //run the function bindEvents which is on the app object

      new Router({  //look up section
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');      
		},
		bindEvents: function () { //method to call certain events
			$('#new-todo').on('keyup', this.create.bind(this)); //creating a new todo on keyup
			$('#toggle-all').on('change', this.toggleAll.bind(this)); //toggle-all on click of toggle arrow down
			$('#footer').on('click', '#clear-completed', this.destroyCompleted.bind(this)); //this will clear completed when the clear completed button is pressed
			$('#todo-list') //example of method chaining
				.on('change', '.toggle', this.toggle.bind(this)) //allows the user to toggle the todo item
				.on('dblclick', 'label', this.edit.bind(this)) //double click to edit 
				.on('keyup', '.edit', this.editKeyup.bind(this)) //look up keyup cmd 
				.on('focusout', '.edit', this.update.bind(this)) //look up focus out
				.on('click', '.destroy', this.destroy.bind(this)); //on click of the red X will delete a todo
		},
		render: function () { //method to control how todos behave on screen
			var todos = this.getFilteredTodos(); //variable set to the App object and pulling getFilteredTodos function
			$('#todo-list').html(this.todoTemplate(todos)); //
			$('#main').toggle(todos.length > 0); //toggle todo in #main section of app
			$('#toggle-all').prop('checked', this.getActiveTodos().length === 0); //call the toggleAll function and render the toggle effect on screen
			this.renderFooter(); //runs the renderFooter function
			$('#new-todo').focus();
			util.store('todos-jquery', this.todos);
		},
		renderFooter: function () {
			var todoCount = this.todos.length; //variable to access the todo array to get the count
			var activeTodoCount = this.getActiveTodos().length; //shows active todo # when the active todo is selected
			var template = this.footerTemplate({ //setting the footer template by telling the app how to calculate the info on the footer
				activeTodoCount: activeTodoCount, //active todo count when the active filter is selected
				activeTodoWord: util.pluralize(activeTodoCount, 'item'), //manipulating the bottom left counter
				completedTodos: todoCount - activeTodoCount, //completed todos is going to be set to todoCount variable minus the activeTodoCount
				filter: this.filter
			});

			$('#footer').toggle(todoCount > 0).html(template);
		},
		toggleAll: function (e) {
			var isChecked = $(e.target).prop('checked'); //checking the target property is checked

			this.todos.forEach(function (todo) {
				todo.completed = isChecked; //setting the todos to completed 
			});

			this.render(); //run the render function to update the data
		},
		getActiveTodos: function () {
			return this.todos.filter(function (todo) {  //returns active todos based on it being set to the opposite of todo.completed
				return !todo.completed;
			});
		},
		getCompletedTodos: function () { //returns completed todos based on it being set to todo.completed
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		getFilteredTodos: function () { //if the filter is set to active it will return the this.getActiveTodos function on the object
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') { //if the filter is set to completed it will return the getCompletedTodos function on the object
				return this.getCompletedTodos();
			}

			return this.todos; //return todos variable
		},
		destroyCompleted: function () { //new method called destroyCompleted
			this.todos = this.getActiveTodos();
			this.filter = 'all';
			this.render();
		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		indexFromEl: function (el) {
			var id = $(el).closest('li').data('id');
			var todos = this.todos;
			var i = todos.length;

			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},
		create: function (e) { //create method
			var $input = $(e.target); 
			var val = $input.val().trim(); 

			if (e.which !== ENTER_KEY || !val) {
				return;
			}

			this.todos.push({
				id: util.uuid(), //calls the util object and runs the uuid method which sets the id
				title: val, 
				completed: false //sets completed status of the new todo to false
			});

			$input.val(''); //clears the input field

			this.render(); //runs the render function
		},
		toggle: function (e) { //new toggle method
			var i = this.indexFromEl(e.target); //var i is set to the indexFromEl function
			this.todos[i].completed = !this.todos[i].completed; 
			this.render(); //runs the render function
		},
		edit: function (e) {
			var $input = $(e.target).closest('li').addClass('editing').find('.edit');
			$input.val($input.val()).focus();
		},
		editKeyup: function (e) {
			if (e.which === ENTER_KEY) {
				e.target.blur();
			}

			if (e.which === ESCAPE_KEY) {
				$(e.target).data('abort', true).blur();
			}
		},
		update: function (e) {
			var el = e.target;
			var $el = $(el);
			var val = $el.val().trim();

			if (!val) {
				this.destroy(e);
				return;
			}

			if ($el.data('abort')) {
				$el.data('abort', false);
			} else {
				this.todos[this.indexFromEl(el)].title = val;
			}

			this.render();
		},
		destroy: function (e) {
			this.todos.splice(this.indexFromEl(e.target), 1);
			this.render();
		}
	};

	App.init();
});