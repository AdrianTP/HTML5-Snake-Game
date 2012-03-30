var Canvas = function(args)
{
  function isset(obj)
  {
    return (typeof(obj) != 'undefined' && obj !== null && obj !== "");
  }
  
  function getEl(el)
  {
    return document.getElementById(el);
  }
  
  var args = isset(args) ? args : {};
  
  var parent = isset(args.parent) ? getEl(args.parent) : getEl('body');
  var id  = isset(args.id) ? args.id : 'canvas';
  var w = isset(args.w) ? args.w : '400';
  var h = isset(args.h) ? args.h : '300';
  var color = isset(args.color) ? args.color : '#FFF';
  var border = isset(args.border) ? args.border : 'none';
  this.ctx;
  
  function Init()
  {
    
    var elem = document.createElement('canvas');
    var el = parent.appendChild(elem);
    el.setAttribute('id',id);
    el.setAttribute('width',w);
    el.setAttribute('height',h);
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    this.ctx = getEl(id).getContext('2d');
    el.style.backgroundColor = color;
    el.style.border = border;
  }
  
  function Clear()
  {
    this.ctx.clearRect(0,0,w,h);
  }
  
  return {
    init: Init,
    clear: Clear,
    id: id,
    w: w,
    h: h,
    ctx: this.ctx
  };
}

var Game = function(canvas_object,grid_size)
{
  var canvas = canvas_object,
    ctx = canvas.ctx,
    grid_size = grid_size,
    field = {
      w: canvas.w / grid_size,
      h: canvas.h / grid_size
    },
    growth_per_bite = 1,
    difficulty = 1,
    speed,
    speed_initial = 200,
    body = [],
    heading,
    amount_to_grow,
    food_location,
    score = 0,
    game_over = false,
    body_color = '#22D',
    food_color = '#2A2',
    interval,
    game_paused = false,
    status_text,
    score_box,
    level_box,
    easy_button,
    normal_button,
    hard_button;
  
  function getEl(el)
  {
    return document.getElementById(el);
  }
  
  function Buttons(state)
  {
    switch(state)
    {
      case 'new':
        status_text = getEl('status-text');
        score_box = getEl('score-box');
        level_box = getEl('level-box');
        easy_button = getEl('easy-button');
        normal_button = getEl('normal-button');
        hard_button = getEl('hard-button');
        easy_button.onclick = function(){Start_Game(1);};
        normal_button.onclick = function(){Start_Game(5);};
        hard_button.onclick = function(){Start_Game(10);};
        break;
      case 'play':
        status_text.style.display = 'none';
        easy_button.style.display = 'none';
        normal_button.style.display = 'none';
        hard_button.style.display = 'none';
        break;
      case 'pause':
        status_text.innerHTML = 'PAUSED';
        status_text.style.display = 'block';
        break;
      case 'over':
        status_text.style.display = 'block';
        easy_button.style.display = 'block';
        normal_button.style.display = 'block';
        hard_button.style.display = 'block';
        status_text.innerHTML = 'GAME OVER';
        break;
    }
  }
  
  function Speed()
  {
    speed = speed_initial - (10 * difficulty);
    return speed;
  }
  
  function Check_Level()
  {
    if (score % 10 == 0)
    {
      difficulty ++;
      clearInterval(interval);
      interval = setInterval(Game_Loop,Speed());
    }
  }
  
  function Init()
  {
    Buttons('new');
  }
  
  function Start_Game(start_difficulty)
  {
    difficulty = growth_per_bite = start_difficulty;
    Reset_Game();
  }
  
  function Reset_Game()
  {
    speed = speed_initial;
    Buttons('play');
    Configure_Input();
    game_over = false;
    heading = 'up';
    score = 0;
    body = [];
    body.unshift(Vector(15,15));
    amount_to_grow = growth_per_bite;
    Update_Score();
    Generate_Food();
    interval = setInterval(Game_Loop,Speed());
  }
  
  function Stop_Game()
  {
    Buttons('over');
    Unbind_Input();
    game_over = true;
    clearInterval(interval);
  }
  
  function Pause_Game()
  {
    switch(game_paused)
    {
      case true:
        game_paused = false;
        interval = setInterval(Game_Loop,Speed());
        Buttons('play');
        break;
      case false:
        game_paused = true;
        clearInterval(interval);
        Buttons('pause');
        break;
    }
  }
  
  function Configure_Input()
  {
    KeyboardJS.bind.key('up',   function(){heading = (heading == 'down')  ? 'down'  : 'up'},    null);
    KeyboardJS.bind.key('down', function(){heading = (heading == 'up')    ? 'up'    : 'down'},  null);
    KeyboardJS.bind.key('left', function(){heading = (heading == 'right') ? 'right' : 'left'},  null);
    KeyboardJS.bind.key('right',function(){heading = (heading == 'left')  ? 'left'  : 'right'}, null);
    KeyboardJS.bind.key('p',Pause_Game, null);
  }
  
  function Unbind_Input()
  {
    KeyboardJS.unbind.key('up');
    KeyboardJS.unbind.key('down');
    KeyboardJS.unbind.key('left');
    KeyboardJS.unbind.key('right');
    KeyboardJS.unbind.key('p');
  }
  
  function Update_Game_State()
  {
    Move_Snake();
    Check_Eat_And_Death();
  }
  
  function Update_Screen()
  {
    canvas.clear();
    Display('snake');
    Display('food');
  }
  
  function Game_Loop()
  {
    Update_Game_State();
    Update_Screen();
  }
  
  function Move_Snake()
  {
    var head = body[0];
    
    switch (heading)
    {
      case 'up':
        body.unshift(Vector(head.x, head.y - 1));
        break;
      case 'down':
        body.unshift(Vector(head.x, head.y + 1));
        break;
      case 'left':
        body.unshift(Vector(head.x - 1, head.y));
        break;
      case 'right':
        body.unshift(Vector(head.x + 1, head.y));
    }
    
    if (amount_to_grow == 0)
    {
      body.pop();
    }
    else
    {
      amount_to_grow --;
    }
  }
  
  function Check_Eat_And_Death()
  {
    var head = body[0];
    
    // Check if snake is eating
    if (head.x == food.x && head.y == food.y)
    {
      amount_to_grow += growth_per_bite;
      score += 1;
      Check_Level();
      Update_Score();
      Generate_Food();
    }
    // Check if snake collided with a wall
    if (head.x == -1 || head.y == -1 || head.x >= field.w || head.y >= field.h)
    {
      Stop_Game();
    }
    
    // Check if snake collided with itself
    if (Collision(head,false))
    {
      Stop_Game();
    }
  }
  
  function Display(what)
  {
    switch (what)
    {
      case 'snake':
        for (var i = 0; i < body.length; i ++)
        {
          Draw_Dot(body[i],body_color,'square');
        }
        break;
      case 'food':
        Draw_Dot(food,food_color,'circle');
        break;
    }
  }
  
  function Generate_Food()
  {
    var food_temp = Vector(Math.round(Math.random() * (field.w - 1)),Math.round(Math.random() * (field.h - 1)));
    
    if (Collision(food_temp,true))
    {
      Generate_Food();
    }
    else
    {
      food = food_temp;
    }
  }
  
  function Draw_Dot(coords,color,shape)
  {
    var dot = {
      x: coords.x * grid_size,
      y: coords.y * grid_size
    };
    ctx.save();
    ctx.translate(dot.x,dot.y);
    switch (shape)
    {
      case 'square':
        ctx.fillStyle = color ? color : '#00F';
        ctx.beginPath();
        ctx.rect(0,0,grid_size,grid_size);
        ctx.fill();
        break;
      case 'circle':
        ctx.fillStyle = color ? color : '#0F0';
        ctx.beginPath()
        ctx.arc(grid_size/2,grid_size/2,grid_size/2,0,2*Math.PI,true);
        ctx.fill();
        break;
    }
    ctx.restore();
  }
  
  function Collision(coords,include_head)
  {
    var i = include_head ? 0 : 1;
    
    for (i; i < body.length; i ++)
    {
      if (coords.x == body[i].x && coords.y == body[i].y)
      {
        return true;
      }
    }
    
    return false;
  }
  
  function Vector(x,y)
  {
    return {
      x: x,
      y: y
    };
  }
  
  function Update_Score()
  {
    level_box.innerHTML = difficulty;
    score_box.innerHTML = score;
  }
  
  return {
    init: Init
  };
}

function Init()
{ 
  window.canvas = Canvas(
  {
    parent: 'screen',
    id: 'canvas',
    w: 600,
    h: 400,
    color: '#000',
    border: 'none'
  });
  canvas.init();
  window.game = Game(canvas,20);
  game.init();
// TO-DO:
// Add selectable difficulty
// Make difficulty go up every x apples
// Bring getEl and isset inside Canvas function
//  to clear external dependencies
// Clean up HTML element calls, compile into
//  internal methods in Game function
}
