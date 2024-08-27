VENV=./venv
ACTIVATE=$(VENV)/bin/activate

DATA=	data/affected-people/refugees.csv \
	data/affected-people/humanitarian-needs.csv \
	data/coordination-context/operational-presence.csv \
	data/coordination-context/funding.csv \
	data/coordination-context/conflict-event.csv \
	data/coordination-context/national-risk.csv \
	data/food/food-security.csv \
	data/food/food-price.csv \
	data/population-social/population.csv \
	data/population-social/poverty-rate.csv \
	data/metadata/admin1.csv \
	data/metadata/admin2.csv \
	data/metadata/currency.csv \
	data/metadata/dataset.csv \
	data/metadata/location.csv \
	data/metadata/org.csv \
	data/metadata/org-type.csv \
	data/metadata/resource.csv \
	data/metadata/sector.csv \
	data/metadata/wfp-commodity.csv \
	data/metadata/wfp-market.csv

SCRIPT=./download-hapi-subcategory.py

all: $(DATA)

data/%.csv: $(ACTIVATE)
	. $(ACTIVATE) && python3 $(SCRIPT) `echo $* | tr '/' ' '` > data/$*.csv

$(ACTIVATE): requirements.txt
	rm -rf venv
	python -m venv venv
	. $(ACTIVATE) && pip3 install -r requirements.txt

clean:
	rm -rfv $(VENV) $(DATA)
