n = 200 # how many alternatives to generate

import pandas as pd
from random import randint

# assign a price to each car in CAD
price = pd.Series([ randint(3500, 35000) for car in range(n) ], name = 'Price')

# assign a milage 
milage = pd.Series([ randint(200, 150000) for car in range(n) ], name = 'Milage')

# assign how many miles per gallon the car runs on average
mpg = pd.Series([ randint(30, 70) for car in range(n) ], name = 'FuelEfficiency')

# assign carbon dioxide emissions per gallon in grams
co2 = pd.Series([ randint(8000, 9000) for car in range(n) ], name = 'Emissions')

# subjective coolness on scale from 1 (lame) to 5 (neat)
cool = pd.Series([ randint(1, 5) for car in range(n) ], name = 'Rating')

import pandas as pd

attributes = [ price, milage, mpg, co2, cool ]
cars = pd.concat(attributes, axis = 1)

ideal = { 
  'Price' : 1, # minimize
  'Milage' : 1, # also minimize
  'FuelEfficiency' : - 1, # maximize (minimize the negative)
  'Emissions' : 1, # minimize again
  'Rating' : -1 # maximize
} 

multipliers = [ ideal[c] for c in cars.columns ]

def dominates(challenger, challenged): # smaller is better
  if all(v <= w for v, w in zip(challenger, challenged)): # if all aspects are at least as good
    return any( v < w for v, w in zip(challenger, challenged)) # and at least one is actually better
  return False

nondominated = set()

for i, data in cars.iterrows():
  car = [ m * v for m, v in zip(multipliers, data) ]
  discard = False # assume it to be invincible
  for j in range(i + 1, n): # check all the other cars
    otherData = cars.iloc[j] # get their data
    alt = [ m * v for m, v in zip(multipliers, otherData) ]
    if dominates(alt, car): # challenge the car with the alternative
      discard = True # we will not want to consider the loser
      break # no need to check further, it was already beaten
  if not discard: # nothing beat it
    nondominated.add(i) # remember the row

keep = sorted(list(nondominated))
cand = cars.iloc[keep]

vars = ['Milage', 'FuelEfficiency', 'Emissions']
threedim = cand[vars]

import numpy as np
import matplotlib.pyplot as plt

stars = dict()
for quantity in [3, 4, 5]: # we already filtered out 1 and 2
  stars[quantity] = cand.loc[ cand['Rating'] == quantity ]

marker = { 
  5 : '*', # use a star for 5
  4 : 'P', # use a thick plus for 4
  3 : 'd' # use a thin diamond for 3
}

data = dict()

for q in stars:
  subset = cand.loc[ cand['Rating'] == q ] # match the stars
  td = subset[vars] # get the three axis values
  M = np.array([ [ td[c][i] for c in td.columns ] for i in td.index ])
  color = subset['Price'].tolist()
  data[q] = (M, color)

fig = plt.figure(1, figsize = (10, 6), dpi =  100)
a = fig.add_subplot(projection = '3d')
for q in stars:
  m, color = data[q]
  x = m[:, 0]
  y = m[:, 1]
  z = m[:, 2]
  plot = a.scatter(x, y, z, marker = marker[q], c = color, cmap = plt.cm.winter, s = 150)
a.set_xlabel(vars[0])
a.set_ylabel(vars[1])
a.set_zlabel(vars[2])
legend = fig.colorbar(plot, orientation = 'vertical', shrink = 0.5) 
legend.set_label('Price') 
plt.show()






