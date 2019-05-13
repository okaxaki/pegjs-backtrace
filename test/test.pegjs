start = additive

plus = "+"

mult = "*"

additive = multiplicative plus additive / multiplicative

multiplicative = primary mult multiplicative / primary

primary = integer / "(" additive ")"

integer = digits:[0-9]+
