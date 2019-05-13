start = additive

ws = (" ")*
plus = "+"
mult = "*"
div = "/"
left_parens = "("
right_parens = ")"
integer = $([1-9] [0-9]*)

additive =
  ws left:multiplicative ws operator:plus ws right:additive
  { return { left, operator, right } }
  /
  ws m:multiplicative ws
  { return m }

multiplicative =
  ws left:divisive ws operator:mult ws right:multiplicative
  { return { left, operator, right } }
  /
  ws m:divisive ws
  { return m }

divisive =
  ws left:primary ws operator:div ws right:divisive ws
  { return { left, operator, right } }
  /
  ws m:primary ws
  { return m }

primary =
  ws integer:integer ws
  { return { integer } }
  /
  ws left_parens ws group:additive ws right_parens ws
  { return { group } }
