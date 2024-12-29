# Project Estimation - FUTURE
Date: 2024-05-05

Version: 1.0


# Estimation approach
Consider the EZElectronics  project in FUTURE version (as proposed by your team in requirements V2), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch (not from V1)
# Estimate by size
### 
|                                                                                                         | Estimate  |             
|---------------------------------------------------------------------------------------------------------|-----------|  
| NC =  Estimated number of classes to be developed                                                       | 12        |             
| A = Estimated average size per class, in LOC                                                            | 120       | 
| S = Estimated size of project, in LOC (= NC * A)                                                        | 1440      |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)                    | 144       |   
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro)                                     | 4320      | 
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) | 0,9 weeks |               

# Estimate by product decomposition
### 
| component name       | Estimated effort (person hours) |             
|----------------------|---------------------------------| 
| requirement document | 24 h                            |
| GUI prototype        | 16 h                            |
| design document      | 12 h                            |
| code                 | 144 h                           |
| unit tests           | 16 h                            |
| api tests            | 12 h                            |
| management documents | 14 h                            |



# Estimate by activity decomposition
### 
| Activity name        | Estimated effort (person hours) |             
|----------------------|---------------------------------|
| requirement document | 24 h                            |
| GUI prototype        | 16 h                            |
| design document      | 12 h                            |
| management documents | 14 h                            |
| code                 | 144 h                           |
| unit tests           | 16 h                            |
| system tests         | 12 h                            |
###

<img src="images/gantt_v2.png" alt="Example Image">

# Summary
The first approach, estimate by size, is the most simple and quick way to estimate the project. It is based on the number of classes and the average size of each class. This approach is not very accurate because it considers just the code, although it gives a rough estimate of the project. The estimated effort is 144 hours, and the estimated duration is 0.9 weeks.

Another approach is the estimate by product decomposition. This approach is more detailed and considers the different components of the project. The estimated effort is 238 hours, and the estimated duration is 1.5 weeks.

The last approach is the estimate by activity decomposition. This approach is the most detailed and considers the different activities of the project. The estimated effort is 238 hours, and the estimated duration is 2 weeks.
In this case, all activities are estimated to be done by 4 people, but when the activities are done in parallel, is considered that the team is working on the different activities. In particular, design documents and management documents are done in parallel with the code, each by a couple of people.

In conclusion, the estimate by activity decomposition is the most accurate, but it is also the most time-consuming. The estimate by product decomposition is a good compromise between accuracy and time, while the estimate by size is the quickest but the least accurate.


|                                    | Estimated effort | Estimated duration |          
|------------------------------------|------------------|--------------------|
| estimate by size                   | 144 h            | 0,9 weeks          |
| estimate by product decomposition  | 238 h            | 1,5 weeks          |
| estimate by activity decomposition | 238 h            | 2 weeks            |




