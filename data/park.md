---
map: jmap7.svg
comments:
  - Sites 59-75 have been permanently removed.
  - Sites in the 70s and 80s are first come, first served (FCFS), and can be used for the maximum-length stay (15 nights). It is not possible to make reservations and then trade reserved sites for FCFS sites.
  - Sites 90 and 91 are “buffer sites”, where park staff can place campers if there is some sort of mix-up, or if campers’ equipment (e.g., an RV) doesn’t fit in their assigned site.
  - There is no such thing as a tent site or an RV site. All sites are open to all, regardless of their equipment.

# Reservation account aliases
# Colors represent family/groups
# Color names must be official CSS color names;
# see: https://drafts.csswg.org/css-color/#named-colors

accountColors:
  Pete:     skyblue
  Joni:     skyblue
  Carisa:   skyblue
  Paul:     skyblue
  Duck:     skyblue
  PWesley:  skyblue
  
  Dan:      palegreen
  Laurel:   palegreen
  Zach:     palegreen
  Wei:      palegreen
  Becca:    palegreen
  
  James:    khaki
  Corin:    khaki
  Isabella: khaki
  Andrew:   khaki

# The account names below must match the account names above;
# upper/lowercase is significant

reservations:
  - {site: 40,   arrival: 2023-07-22, days: 7, account: Andrew}
  - {site: 103,  arrival: 2023-07-22, days: 7, account: Joni}
  - {site: 95,   arrival: 2023-07-22, days: 7, account: Pete}
  - {site: 93,   arrival: 2023-07-22, days: 7, account: Laurel}
  - {site: 99,   arrival: 2023-07-22, days: 7, account: James}
  - {site: 97,   arrival: 2023-07-23, days: 7, account: Becca}
  - {site: 36,   arrival: 2023-07-23, days: 7, account: Paul}
  - {site: J26,  arrival: 2023-07-24, days: 6, account: Becca}
  - {site: 15,   arrival: 2023-07-28, days: 7, account: Andrew}
  - {site: 59,   arrival: 2023-07-28, days: 7, account: Corin}
  - {site: 95,   arrival: 2023-07-29, days: 7, account: Dan}
  - {site: 99,   arrival: 2023-07-29, days: 7, account: PWesley}
  - {site: 104,  arrival: 2023-07-29, days: 7, account: PWesley}
  - {site: J105, arrival: 2023-07-29, days: 7, account: Duck}
  - {site: 103,  arrival: 2023-07-29, days: 7, account: Carisa}
  - {site: 40,   arrival: 2023-07-29, days: 7, account: Joni}
  - {site: 36,   arrival: 2023-07-30, days: 6, account: Corin}
  - {site: 97,   arrival: 2023-07-30, days: 6, account: Dan}

sites:
  -
    site: 1
    category:
    type: MAIN
    size: L
    tents: 4
    table: Movable
    comment: open, on corner, exposed and near entrance & highway
  -
    site: 2
    category:
    type: MAIN
    size: L
    tents: 3
    table: Movable
    comment: lots of tent space, could be OK in combination with 4, but near entrance & highway
  -
    site: 3
    category:
    type: MAIN
    size: L
    tents: 3
    table: Movable
    comment: drive-thru vehicle access, exposed to much road and site 7, open sun in the afternoon
  -
    site: 4
    category:
    type: MAIN
    size: L
    tents: 3
    table: Movable
    comment: secluded if combined with 5, but site of thefts, near entrance
  -
    site: 5
    category:
    type: MAIN
    size: L
    tents: 1
    table: Movable
    comment: could be OK bedroom site in combination with adjacent site; deep, some exposure to 4 & 6, path to Nature Trail along side
  -
    site: 6
    category: good
    type: MAIN
    size: L
    tents: 2
    table: Movable
    comment: semi-secluded, some exposure to sites 5 & 8
  -
    site: 7
    category:
    type: MAIN
    size: M
    tents: 1
    table: Movable
    comment: exposed to sites 3 & 9
  -
    site: 8
    category: good
    type: MAIN
    size: M
    tents: 1
    table: Movable
    comment: pretty secluded
  -
    site: 9
    category:
    type: MAIN
    size: L
    tents: 4
    table: Movable
    comment: deep, secluded, 6,8,9 would be a good combination, exposed to site 7, front of site is next to bathroom trail
  -
    site: 10
    category: good
    type: MAIN
    size: L
    tents: 2
    table: Movable
    comment: deep, very secluded, good combo with 12,14
  -
    site: 11
    category: limited
    type: HOST
    size: L
    tents:
    table:
    comment: largely paved, open view of bathroom in back
  -
    site: 12
    category: good
    type: MAIN
    size: L
    tents: 3
    table: Movable
    comment: deep, pretty secluded (logically goes with 14)
  -
    site: 13
    category: limited
    type: ADA
    size: M
    tents:
    table:
    comment: largely paved/leveled, formal trail to bathroom in back, secluded
  -
    site: 14
    category: limited
    type: HAZARD
    size: L
    tents: 3
    table:
    comment: deep, pretty secluded, closed in 2014 due to hazardous limbs
  -
    site: 15
    category: good
    type: MAIN
    size: S
    tents: 1
    table: Movable
    comment: deep, secluded, at River Trail, 12,14,15 would be a good combination
  -
    site: 16
    category: bad
    type: MAIN
    size: S
    tents: 2
    table:
    comment: River Trail at back of site
  -
    site: 17
    category: limited
    type: ADA
    size: S
    tents:
    table:
    comment: largely paved/leveled, formal trail to bathroom in back, service road to bathroom on side
  -
    site: 18
    category: bad
    type: MAIN
    size: S
    tents: 2
    table:
    comment: River Trail at back of site
  -
    site: 19
    category:
    type: MAIN
    size: M
    tents: 2
    table: Movable
    comment: secluded, deep, next to bathroom trail and service road, open to site 21
  -
    site: 20
    category: bad
    type: MAIN
    size: S
    tents: 1
    table:
    comment: River Trail practically part of site at rear
  -
    site: 21
    category:
    type: REMOVED?
    size:
    tents: 3
    table:
    comment: exposed, only OK in combo with 19,23,24
  -
    site: 22
    category: bad
    type: MAIN
    size: L
    tents: 3
    table: Movable
    comment: nice site on River Trail (at back of site), deep & secluded
  -
    site: 23
    category:
    type: MAIN
    size: S
    tents: 2
    table: Fixed
    comment: nice bedroom site with 24; on corner, very open and exposed, only OK with 21 & 24
  -
    site: J24
    category:
    type: CABIN
    size: L
    tents: 7
    table:
    comment: adjoins 23; exposed on all sides, only OK with 21 & 23
  -
    site: 25
    category: limited
    type: ADA
    size:
    tents: 3
    table:
    comment: mostly paved/leveled, secluded, near bathroom
  -
    site: J26
    category:
    type: CABIN
    size: L
    tents: 3
    table:
    comment: deep, very exposed to 27 & 29
  -
    site: 27
    category:
    type: MAIN
    size: L
    tents: 2
    table: Fixed
    comment: deep, very exposed to sites 26 & 105, very low fire pit
  -
    site: 28
    category: good
    type: MAIN
    size: L
    tents: 4
    table: Movable
    comment: on corner, exposed to traffic, near campground entrance, good bedroom site, small area allotted for vehicles and for table, bear box, fire pit, equipment
  -
    site: 29
    category: bad
    type: MAIN
    size: L
    tents: 2
    table: Fixed
    comment: open corner site, lots of exposure to road and site 26, fire pit close to bear box
  -
    site: J30
    category:
    type: CABIN
    size:
    tents: 2
    table: Fixed
    comment: open corner site, exposed to road, secluded from other sites, fire pit close to bear box
  -
    site: 31
    category: bad
    type: MAIN
    size: L
    tents: 3
    table: Movable
    comment: exposed site—31 & 32 are basically part of the same site
  -
    site: 32
    category: bad
    type: MAIN
    size: S
    tents: 1
    table: Fixed
    comment: 31 & 32 are basically part of the same site, very high fire pit
  -
    site: 33
    category:
    type: MAIN
    size: S
    tents: 1
    table: Fixed
    comment: lots of sun, little tree cover, fire pit close to parking and road, secluded from other sites (except 34 across road)
  -
    site: 34
    category:
    type: MAIN
    size: S
    tents: 1
    table: Fixed
    comment: lots of sun, fire pit does not accommodate chairs (large rock and post in the way), secluded (except for 33 across road)
  -
    site: 35
    category:
    type: MAIN
    size: S
    tents: 1
    table: Fixed
    comment: lots of afternoon sun, fire pit very close to bear box and parking, secluded
  -
    site: 36
    category:
    type: MAIN
    size: S
    tents: 2
    table: Movable
    comment: nice site, secluded except for pathway on south
  -
    site: 37
    category: limited
    type: ADA
    size: L
    tents: 3
    table: Movable
    comment: mostly paved/leveled, secluded next to campground host on south
  -
    site: 38
    category:
    type: MAIN
    size: S
    tents: 2
    table: Movable
    comment: huge parking area, rocks around fire pit, pathway to north, exposed to 99
  -
    site: 39
    category: limited
    type: ADA
    size:
    tents: 2
    table: Movable
    comment: mostly paved/leveled, secluded
  -
    site: 40
    category: bad
    type: MAIN
    size: S
    tents: 1
    table: Movable
    comment: the 2015 rock quarry has become an open meadow, adjacent to campfire center on south
  -
    site: 41
    category: limited
    type: ADA
    size: S
    tents: 1
    table: Movable
    comment: mostly paved/leveled, secluded but across from south entrance to campfire center
  -
    site: 42
    category:
    type: MAIN
    size: S
    tents: 2
    table: Movable
    comment: some exposure to 44 and adjacent to campfire center on north
  -
    site: 43
    category:
    type: MAIN
    size: S
    tents: 1
    table: Movable
    comment: limited exposure to 45,47 (above 47), view of river, rocks around fire pit
  -
    site: 44
    category: good
    type: MAIN
    size: L
    tents: 3
    table: Movable
    comment: some exposure to 42 otherwise secluded, excellent community site
  -
    site: 45
    category: good
    type: OUTER
    size: L
    tents: 2
    table: Fixed
    comment: some exposure to 43, table, tree, and rocks near very high fire pit
  -
    site: 46
    category: limited
    type: OUTER
    size: S
    tents: 1
    table: Fixed
    comment: large rock near very high fire pit, secluded from other sites, river view, far from bathroom
  -
    site: 47
    category: good
    type: OUTER
    size: L
    tents: 6
    table: Movable
    comment: 2001-2002 base camp, big corner site, lots of exposure to road, river view, exposed to 48
  -
    site: 48
    category: good
    type: OUTER
    size: L
    tents: 5
    table: Movable
    comment: 2001-2002 bedroom site, exposed to 47,49 (though large downed tree separates 48 & 47) and tents can help provide buffer between sites
  -
    site: 49
    category: good
    type: OUTER
    size: L
    tents: 6
    table: Fixed
    comment: premier site at bottom of bathroom stairs, exposed to 48 (tents can provide buffer), uphill path to bathroom on north
  -
    site: 50
    category:
    type: OUTER
    size: S
    tents: 1
    table: Movable
    comment: near sites A & B, no privacy
  -
    site: 51
    category:
    type: OUTER
    size: M
    tents: 2
    table:
    comment: river site, near sites A & B, no privacy
  -
    site: 52
    category:
    type: OUTER
    size: S
    tents: 2
    table: Movable
    comment: river site, lots of afternoon sun, secluded by distance from other sites but adjacent to group site on north
  -
    site: 53
    category:
    type: OUTER
    size: S
    tents: 3
    table: Movable
    comment: river site, decent tree cover, fire pit close to bear box, far from visible adjacent sites 52 & 54, adjacent to trail on west edge of forest
  -
    site: 54
    category:
    type: OUTER
    size: L
    tents: 3
    table: Fixed
    comment: river site, trees frame site on river side, exposed to sites 55 & 56, separated from 53 by distance
  -
    site: 55
    category:
    type: OUTER
    size: S
    tents: 3
    table: Fixed
    comment: river site sandwiched between 54 & 56, trees frame site on river side creating shade, 54,55,56 all run together with no distinction
  -
    site: 56
    category:
    type: OUTER
    size: L
    tents: 3
    table: Fixed
    comment: river site, 54,55,56 all run together, trees frame site on river side, would be great if not for presence of 55
  -
    site: 57
    category:
    type: OUTER
    size: S
    tents: 3
    table: Fixed
    comment: river site, well-used trail between river and forest on north, not much tree cover, lots of sun, relatively secluded
  -
    site: 58
    category: good
    type: OUTER
    size: L
    tents: 4
    table: Fixed
    comment: river site, separated by distance and shrubs from 57, no sites to south, good tree cover
  -
    site: 59
    category: good
    type: OUTER
    size: M
    tents: 4
    table: Fixed
    comment: river site
  -
    site: 60
    category: good
    type: OUTER
    size: M
    tents: 2
    table: Fixed
    comment: river site, very nice
  -
    site: 76
    category: good
    type: OUTER
    size: L
    tents: 3
    table: Movable
    comment:
  -
    site: 77
    category: good
    type: OUTER
    size: L
    tents: 3
    table:
    comment: (Lyon’s base camp in 2005), very secluded, high fire pit, far from bathroom
  -
    site: 78
    category: good
    type: OUTER
    size: M
    tents: 2
    table: Movable
    comment:
  -
    site: 79
    category: good
    type: OUTER
    size: M
    tents: 2
    table: Fixed
    comment: big site, but much of it is large parking lot, secluded, far from bathroom
  -
    site: 80
    category: good
    type: OUTER
    size: L
    tents: 4
    table: Movable
    comment: in big trees, some exposure to 78, lots of exposure to 81, defunct bathroom in view to west, high fire pit, far from usable bathroom
  -
    site: 81
    category: good
    type: OUTER
    size: L
    tents: 2
    table: Fixed
    comment: excellent if combined with 80, fully exposed to 80 otherwise secluded, high fire pit
  -
    site: 82
    category: limited
    type: FCFS
    size: L
    tents: 2
    table: Fixed
    comment: very deep, typically for RVs, exposed to 83 otherwise secluded, far from bathroom
  -
    site: 83
    category: good
    type: OUTER
    size: S
    tents: 1
    table: Movable
    comment: exposed to 82 and some exposure to 85, far from bathroom
  -
    site: 84
    category: good
    type: OUTER
    size: S
    tents: 1
    table: Movable
    comment: secluded, shady, large tree blocks fire pit seating, far from bathroom
  -
    site: 85
    category: good
    type: OUTER
    size: S
    tents: 1
    table: Movable
    comment: some exposure to 83 & 87, low fire pit, far from bathroom
  -
    site: 86
    category: good
    type: OUTER
    size: M
    tents: 2
    table: Movable
    comment: some exposure to park maintenance facility in back otherwise secluded, far from bathroom
  -
    site: 87
    category: good
    type: OUTER
    size: S
    tents: 1
    table: Movable
    comment: little tree cover, lots of sun, leveled somewhat like ADA sites, largely secluded, far from bathroom
  -
    site: 88
    category: good
    type: OUTER
    size: M
    tents: 2
    table: Movable
    comment: very secluded except for some exposure to park maintenance facility in back, far from bathroom
  -
    site: 89
    category: good
    type: OUTER
    size: M
    tents: 2
    table: Movable
    comment: very secluded, nice in back, far from bathroom
  -
    site: 90
    category: limited
    type: BUFFER
    size: S
    tents: 1
    table: Movable
    comment: close to and somewhat exposed to major east-west campground road, otherwise secluded, far from bathroom
  -
    site: 91
    category: limited
    type: BUFFER
    size: M
    tents: 1
    table: Movable
    comment: close to and somewhat exposed to major east-west campground and maintenance facility roads, otherwise secluded, far from bathroom
  -
    site: 92
    category:
    type: MAIN
    size: M
    tents: 2
    table: Movable
    comment: open, unappealing, rocks/trees on one side of fire pit, pretty secluded despite major east-west campground road on south, far from bathroom
  -
    site: 93
    category:
    type: MAIN
    size: M
    tents: 2
    table: Movable
    comment: fairly secluded, far from bathroom
  -
    site: 94
    category:
    type: MAIN
    size: S
    tents: 2
    table: Movable
    comment: adjacent to main north-south campground road on east, parking for 3 vehicles, relatively secluded, far from bathroom
  -
    site: 95
    category:
    type: MAIN
    size: S
    tents: 2
    table: Movable
    comment: some exposure to 97, lots of sun in the noon hour, trees and shrubs around part of fire pit, far from bathroom
  -
    site: 96
    category:
    type: MAIN
    size: S
    tents: 2
    table: Movable
    comment: secluded but adjacent to main north-south campground road on east, far from bathroom
  -
    site: 97
    category:
    type: MAIN
    size: S
    tents: 2
    table: Movable
    comment: open—lots of morning sun, some exposure to 95 & 99, worked well as a base camp in 2023
  -
    site: 98
    category: good
    type: MAIN
    size: S
    tents: 2
    table: Movable
    comment: cute site, secluded on all sides
  -
    site: 99
    category: bad
    type: MAIN
    size: L
    tents: 2
    table: Movable
    comment: not very private, exposure to 97 & 38
  -
    site: 100
    category: good
    type: MAIN
    size: M
    tents: 3
    table: Movable
    comment: room for 3 vehicles, shady and pretty well secluded despite bathroom on north side and pathway on south side
  -
    site: 101
    category:
    type: MAIN
    size: S
    tents: 2
    table: Movable
    comment: fire pit close to bear box, very open—not much tree cover to northeast, very secluded, could be good bedroom site
  -
    site: 102
    category: good
    type: MAIN
    size: S
    tents: 2
    table: Movable
    comment: high fire pit, campsite is dark along the rear (dense tree cover), very secluded, bathroom across road but largely hidden from view due to shrubs, close to kiosk
  -
    site: 103
    category:
    type: MAIN
    size: M
    tents: 2
    table: Movable
    comment: 2004 bedroom site; bear box is taller and shallower than standard box and is harder to open, tall fire pit is close to bear box and large tree, some exposure to bathroom on south, 105 on north, 31 on west, open to southeast (not much tree cover on that side)
  -
    site: 104
    category:
    type: MAIN
    size: L
    tents: 3
    table: Movable
    comment: 2004 base camp; room for 3 vehicles, weird bear box placement at head of parking area, secluded, good community site
  -
    site: J105
    category:
    type: CABIN
    size: M
    tents: 4
    table: Movable
    comment: exposure to 103 & 27, fire pit placed at head of parking area
  -
    site: 106
    category: bad
    type: MAIN
    size: S
    tents: 2
    table: Movable
    comment: open site on corner, lots of exposure to road traffic at fairly busy corner
---