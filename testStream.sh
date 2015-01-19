#!/bin/bash

for i in `seq 1 10`;
do
    sleep 0.5
    echo $i
done

exit $((RANDOM % 2))