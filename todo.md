- No feature shall break esixting offline pwa in production should work with existing firestore documents or offline saved tasks

## already completed todo / testing todo

- ~~schedule 1 time tasks to a specific day / time~~

- ~~assign tasks~~

- ~~field for writing who completed a tasks~~

- ~~task completion analysis page - leaderboard for most task completed~~

- ~~recycle bin showing deleted tasks with remove from firestore or restore option.~~

- ~~retain filter options between reloads~~

- ~~loading tasks overview blocking ui sometimes , is it because there is no tasks to be shown or when syncing or updating. if syncing or updating we dont have to show a full screen loading screen~~

- ~~completed filter in one time tasks section~~

- ~~why is one time tasks section has naming such as upcoming , pending seems more apt,~~

- ~~default time in new task form is 12:00 AM, so if i leave blank it does not show it as any time in day~~

- ~~abilty to add multiple people as assignees / completers~~

- ~~in leaderboard multiple people with same number of tasks completed should be sharing there position~~

- ~~adding assignees with different case naming can result in duplicates of same people so there shall be a way to add a person only once and select his name from a dropdown or searchable list, maybe the leaderboard section can have a participants adding /managing section or in a specific section.~~

- ~~New task button content can be just a + icon in small screens~~

- ~~add new tasks with high priority by default~~

- ~~the priority ordering is wierd now when i am in filter state like indoor/ outdoor the order numbering is off like 3,4,8,9,12 and when i move the numbers change like when i take 8th one up the number change on each press till it reaches 5 then it moves to top where 4th. we need a smooth flow were items move uo or down in single press~~

- ~~the coluring of leaderboard shall be goldish, silverish, bronzish then whatever for rest of the ranks~~

- ~~the sizing of leaderboard shall be bigger for higher ranks then smaller for lower ranks~~

## pending todo

- Pressing escape should close all of the forms/popups or other screens like settings,leaderboard

- the assignees input with dropdown options do not show option when entering a second assignee after a comma, it only shows the first assignee as an option

- a logo and title to look well when installed as pwa

- i deleted a lot of tasks from the recycle bin from device A then i checked firestore and saw that those tasks are gone as expected then i checked device b and saw that the deleted tasks were still in the recycle bin. so deletion of a firestore document from device a is not syncing with device b
