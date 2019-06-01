fetch('allergies.yml').then(function(resp) {
	resp.text().then(function(yaml) {
		data = jsyaml.safeLoad(yaml);
		startApp(yaml);
	});
});

Vue.component('list-item', {
	props: ['allergy', 'icon'],
	computed: {
		twoLine() {
			return (typeof this.allergy === 'string' || this.allergy instanceof String)
		},
		name() {
			return Object.keys(this.allergy)[0]
		},
		extra() {
			return this.allergy[Object.keys(this.allergy)[0]]
		},
		img() {
			return this.icon
		}
	},
	template: `
		<li v-if="twoLine" class="mdl-list__item mdl-list__item">
			<span class="mdl-list__item-primary-content">
				<img :src="img" class="mdl-list__item-avatar"/>
				{{allergy}}
			</span>
		</li>
		<li v-else class="mdl-list__item mdl-list__item--two-line">
			<span class="mdl-list__item-primary-content">
				<img :src="img" class="mdl-list__item-avatar"/>
				<span>{{name}}</span>
				<span class="mdl-list__item-sub-title">{{extra}}</span>
			</span>
		</li>
	`
});

Vue.component('card', {
	props: ['category', 'allergies'],
	computed: {
		icon() {
			iconMap = {
				meat: "steak",
				vegetable: "corn",
				grain: "flour",
				dairy: "cheese",
				spice: "saltpepper",
				legume: "nuts",
				fruit: "orange",
				other: "sauce"
			};
			category = this.category.toLowerCase();
			if (category.charAt(category.length - 1) == 's') {
				category = category.slice(0, category.length - 1);
			}
			return "icons/" + iconMap[category] + ".svg"
		},
		style() {
			return "background-image: url(" + this.icon + ")"
		}
	},
	template: `
		<div class="mdl-card mdl-shadow--2dp card">
			<div class="mdl-card__title mdl-card--expand mdl-card--border card-background" :style="style">
				<h2 class="mdl-card__title-text">{{category}}</h2>
			</div>
			<div class="mdl-card__supporting-text">
				<ul class="mdl-list">
					<list-item v-for="allergy in allergies" v-bind:allergy="allergy" v-bind:icon="icon" />
				</ul>
			</div>
		</div>
	`
});

function startApp(yaml) {
	new Vue({
		el: "#app",
		data: jsyaml.safeLoad(yaml),
		mounted() {
			this.fit();
			search_el = document.getElementById('search-field');
			search_el.addEventListener('keydown', this.search);
			search_el.addEventListener('change', this.search);
			this.cardWidth = document.getElementsByClassName('card')[0].clientWidth;
			this.$nextTick(function () {
				componentHandler.upgradeAllRegistered();
			})
		},
		created() {
			window.onresize = this.fit;
			this.comp = jsyaml.safeLoad(yaml).allergies;
			this.index = elasticlunr(function () {
				this.addField('category');
				this.addField('allergies');
				this.setRef('category');
			});
			for (category in this.allergies) {
				doc = {
					category: category,
					allergies: ''
				};
				this.allergies[category].forEach(function(allergy) {
					if (typeof allergy === 'string' || allergy instanceof String) {
						doc.allergies += allergy + ' ';
					} else {
						doc.allergies += Object.keys(allergy)[0] + ' ' + allergy[Object.keys(allergy)[0]] + ' ';
					}
				});
				this.index.addDoc(doc);
			}
		},
		methods: {
			search: function() {
				parent = this;
				setTimeout(function() {
					query = document.getElementById('search-field').value;
					if (query.length == 0) {
						parent.allergies = parent.comp;
					} else {
						res = parent.index.search(query, {expand: true});
						allergies = {};
						res.forEach(function(el) {
							allergies[el.ref] = parent.comp[el.ref];
						});
						parent.allergies = allergies;
					}
				}, 0);
			},
			fit: function() {
				cards = document.getElementById('cards');
				scrollWidth = cards.scrollWidth / this.cardWidth;
				clientWidth = cards.clientWidth / this.cardWidth;
				clientHeight = cards.clientHeight;
				overflowWidth = 2 * (scrollWidth - clientWidth);
				if(overflowWidth > 0) {
					cards.style.height = clientHeight + 100 + 'px'
				} else {
					cards.style.height = clientHeight - 100 + 'px';
					setTimeout(this.fit, 0);
				}
			}
		},
		watch: {
			allergies: function() {
				this.fit();
			}
		},
		template: `
			<div class="cards" id="cards" style="height:undefined">
				<card v-for="(allergy, category) in allergies" v-bind:category="category" v-bind:allergies="allergy" />
			</div>
		`
	});
}
