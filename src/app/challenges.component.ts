import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { MyChallenge } from './models/my_challenge';
import { GameService } from './game.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { Challenge } from './models/challenge';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest, of  } from 'rxjs';
import { Category } from './models/category';
import { MyCategory } from './models/my_category';

@Component({
  selector: 'app-challenges',
  template: `
    <div uk-grid>
      <div class="uk-width-auto@m">
          <ul class="uk-tab-left" uk-tab="connect: #component-tab-left; animation: uk-animation-fade">
            <li *ngFor="let mycat of mycategories"><a href="#">{{ mycat.category.name.fr }}</a></li>
          </ul>
          <button class="uk-button uk-align-center"
            (click)="save()"
            [class.uk-button-primary]="isSavePrimary"
            *ngIf="auth.user$ | async">
            <span uk-icon="icon: upload" *ngIf="!isSaveLoading"></span>
            <span uk-spinner="ratio: 0.5" *ngIf="isSaveLoading"></span>
            Sauvegarder</button>
      </div>
      <div class="uk-width-expand@m">
          <ul id="component-tab-left" class="uk-switcher">
              <li *ngFor="let mycat of mycategories">
                <table class="uk-table uk-table-divider">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Terminé ?</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let mych of mycat.mychallenges">
                      <td>{{ mych.challenge.label.fr }}</td>
                      <td>
                        <a class="uk-badge" [class.active]="mych.done" (click)="markAsDone(mych, 0)">Terminé</a>
                        <ng-container *ngIf="mych.challenge.missions">
                          <a *ngFor="let m of [1, 2, 3]"
                            class="uk-badge"
                            [class.active]="m <= mych.nbMissions"
                            (click)="markAsDone(mych, m)">
                            {{m}}
                          </a>
                        </ng-container>
                      </td>
                      <td>{{ mych.getPts() }}pts</td>
                    </tr>
                  </tbody>
                </table>
              </li>
          </ul>
      </div>
    </div>
    `,
  styles: [`
    .active {
      background-color: #900;
      color: #fff;
    }
  `]
})
export class ChallengesComponent implements OnInit {

  mycategories: MyCategory[] = [];

  mychallenges;

  isSavePrimary = false;
  isSaveLoading = false;

  constructor(
    public auth: AuthService,
    public game: GameService,
    public afs: AngularFirestore,
  ) { }

  ngOnInit() {
    combineLatest([
      this.getChallenges(),
      this.getCategories(),
      this.getMyChallenges()
    ]).subscribe(data => {
      const [challenges, categories, mychallenges] = data;
      this._load(challenges, categories, mychallenges);
    });
  }

  getChallenges() {
    const options = ref => ref.orderBy('position', 'asc');
    return this.afs
    .collection<Challenge>('challenges', options)
    .snapshotChanges()
    .pipe(
      map(actions => actions.map(a => {
        const uid = a.payload.doc.id;
        const data = a.payload.doc.data() as Challenge;
        return {uid, ...data};
      }))
    );
  }

  getCategories() {
    const options = ref => ref.orderBy('position', 'asc');
    return this.afs
      .collection<Challenge>('categories', options)
      .snapshotChanges()
      .pipe(
        map(actions => actions.map(a => {
          const uid = a.payload.doc.id;
          const data = a.payload.doc.data() as Challenge;
          return {uid, ...data};
        }))
      );
  }

  getMyChallenges() {
    return this.auth.user$.pipe(
      flatMap(user => this._getMyChallenges(user))
    );
  }

  _getMyChallenges(user) {
    if (!user) {
      return of([]);
    }
    const mychallengesRef = this.afs.doc(`users/${user.uid}`).collection('mychallenges');
    return mychallengesRef.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data();
        return {...data};
      }))
    );
  }

  _load(challenges, categories, mychallenges) {
    let done, nbMissions;
    this.mycategories = [];
    for (const cat of categories) {
      const category = new Category(cat.uid, cat.name, cat.position);
      const mycategory = new MyCategory(category);
      for (const ch of challenges) {
        if (ch.category !== cat.uid) {
          continue;
        }
        const challenge = new Challenge(ch.uid, ch.label, ch.missions, ch.points, ch.position, cat);
        const mychallenge = mychallenges.find(c => c.challenge === challenge.uid);
        if (mychallenge) {
          done = true;
          nbMissions = mychallenge.nbMissions;
        } else {
          done = false;
          nbMissions = 0;
        }
        const mych = new MyChallenge(challenge, done, nbMissions);
        mycategory.mychallenges.push(mych);
      }
      this.mycategories.push(mycategory);

      // save original mychallenges
      this.mychallenges = mychallenges;
    }
  }

  markAsDone(c: MyChallenge, nb: number) {
    if (c.done && nb === c.nbMissions) {
      c.done = false;
      c.nbMissions = 0;
    } else {
      c.done = true;
      c.nbMissions = nb;
    }
    c.changed = true;
    this.checkChanges();
  }

  /**
   * {challenge, nbMissions}
   */
  checkChanges() {
    const toSet = [];
    const toDelete = [];
    const A = this.mychallenges;
    const B = this.buildMyChallenges();

    for (const e of B) {
      const found = A.find(f => f.challenge === e.challenge);
      if (!found || found.nbMissions !== e.nbMissions) {
        toSet.push(e);
      }
    }

    for (const e of A) {
      const found = B.find(f => f.challenge === e.challenge);
      if (!found) {
        toDelete.push(e);
      }
    }

    this.isSavePrimary = toSet.length !== 0 || toDelete.length !== 0;
    return [toSet, toDelete];
  }

  buildMyChallenges() {
    const res = [];
    for (const mycategory of this.mycategories) {
      for (const mychallenge of mycategory.mychallenges) {
        if (mychallenge.done) {
          res.push(mychallenge.export());
        }
      }
    }
    return res;
  }

  async save() {
    const [toSet, toDelete] = this.checkChanges();
    this.isSaveLoading = true;
    this.auth.user$.subscribe(user => {
      this.game.save(toSet, toDelete, user.uid, () => {
        this.isSavePrimary = false;
        this.isSaveLoading = false;
      });
    });
  }

}
