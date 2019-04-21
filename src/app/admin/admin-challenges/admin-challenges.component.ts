import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import UIkit from 'uikit';

import { Challenge } from 'src/app/models/challenge';
import { Category } from 'src/app/models/category';

import { DataService } from 'src/app/services/data.service';
import { ChangeService } from 'src/app/services/change.service';

@Component({
  selector: 'app-admin-challenges',
  template: `
    <div class="uk-margin">
      <label for="category">Catégorie : </label>
      <div class="uk-inline">
        <select [(ngModel)]="category" (change)="changeCategory()" class="uk-select">
          <option *ngFor="let cat of categories" [ngValue]="cat">{{ cat.name.fr }}</option>
        </select>
      </div>
    </div>

    <div *ngIf="category">
      <table class="uk-table uk-table-divider">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Missions ?</th>
            <th>Points</th>
            <th>Position</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let ch of challenges">
            <td>{{ ch.label.fr }}</td>
            <td>{{ ch.missions }}</td>
            <td>{{ ch.points }}pts</td>
            <td>{{ ch.position }}</td>
            <td>
              <a uk-icon="pencil" (click)="modifyChallenge(ch)"></a>
              <a uk-icon="trash" (click)="deleteChallenge(ch)"></a>
            </td>
          </tr>
        </tbody>
      </table>

      <a class="uk-button uk-button-default" (click)="addChallenge()">Ajouter un défi</a>
    </div>

    <!-- MODAL challenge -->
    <div id="modal-challenge" uk-modal>
      <div class="uk-modal-dialog uk-modal-body" *ngIf="challenge">
          <button class="uk-modal-close-default" type="button" uk-close></button>
          <h2 class="uk-modal-title">{{ title }}</h2>
          <p>
            <label for="name">Catégorie</label>
            {{ category.name.fr }}
          </p>
          <p>
            <label for="name">Label</label>
            <input type="text" [(ngModel)]="challenge.label.fr" />
          </p>
          <p>
            <label for="missions">Missions</label>
            <input type="checkbox" [(ngModel)]="challenge.missions" />
          </p>
          <p>
            <label for="number">Points</label>
            <input type="number" [(ngModel)]="challenge.points" />
          </p>
          <p>
            <label for="position">Position</label>
            <input type="number" [(ngModel)]="challenge.position" />
          </p>
          <p><button (click)="_modifyChallenge()">Valider</button></p>
      </div>
    </div>
  `,
  styles: []
})
export class AdminChallengesComponent implements OnInit, OnDestroy {

  public categories: Category[];
  public category: Category;
  public original;

  public challenges: Challenge[] = [];

  // Modal
  public title = 'Ch';
  public challenge: Challenge;

  constructor(
    public data: DataService,
    public afs: AngularFirestore,
    public changeService: ChangeService,
  ) { }

  ngOnInit() {
    this.data.getCategories()
      .subscribe(categories => this.categories = categories);
  }

  ngOnDestroy() {
    const modal = document.getElementById('modal-challenge');
    if (modal) {
      modal.remove();
    }
  }

  changeCategory() {
    this.challenges = this.category.challenges;
  }

  addChallenge() {
    this.challenge = new Challenge({category: this.category});
    UIkit.modal('#modal-challenge').show();
  }

  modifyChallenge(ch) {
    this.challenge = ch;
    this.original = Object.assign({}, ch.export());
    UIkit.modal('#modal-challenge').show();
  }

  _modifyChallenge() {
    UIkit.modal('#modal-challenge').hide();
    if (this.challenge.uid) {
      this.afs.doc(`categories/${this.category.uid}/challenges/${this.challenge.uid}`)
        .update(this.challenge.export());

      // new change
      this.changeService.challengeUpdate(
        `${this.challenge.label.fr} (${this.category.name.fr})`,
        (this.original.points !== this.challenge.points ||
          this.original.missions !== this.challenge.missions)
      );
    } else {
      this.afs.collection(`categories/${this.category.uid}/challenges`).add(this.challenge.export());

      // new change
      this.changeService.challengeCreate(
        `${this.challenge.label.fr} (${this.category.name.fr})`,
        false
      );
    }

    this.refreshChallenges();
  }

  deleteChallenge(ch) {
    UIkit.modal.confirm('Confirmer?').then(
      () => {
        this.afs.doc(`categories/${this.category.uid}/challenges/${ch.uid}`).delete();

        // new change
        this.changeService.challengeDelete(
          `${ch.label.fr} (${this.category.name.fr})`,
          true
        );

        this.refreshChallenges();
      },
      () => {
        // do nothing
      }
    );
  }

  refreshChallenges() {
    this.data.getChallenges(this.category.uid)
      .subscribe(challenges => this.challenges = challenges);
  }

}
