
const Sauce = require('../models/sauce');
const fs = require('fs');

exports.creatSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: []
  });
  sauce.save()
    .then(() => res.status(201).json({ message: 'Sauce créer !' }))
    .catch(error => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(400).json({ error }));
};
exports.getAllSauce = (req, res, next) => {
  Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error }));
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ?
    {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  if (req.file) {
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => { console.log("fichier supprimé") })
      })
  }
  Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
    .then(res.status(200).json({ message: 'Sauce modifié !' }))
    .catch((error) => res.status(400).json({ error }));

};


exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Sauce supprimé !' }))
          .catch(() => res.status(400).json({ error }));
      });
    })
    .catch(() => res.status(500).json({ error }));
};

exports.likeDislike = (req, res) => {
  const userId = req.body.userId;
  const sauceId = req.params.id;
  const likeStatut = req.body.like;

  switch (likeStatut) {
    //like=1 = un likes pour la sauce est ajouté avec l'id de l'user dans usersLiked
    case 1:
      Sauce.updateOne({ _id: sauceId }, { $inc: { likes: 1 }, $push: { usersLiked: userId } })
        .then(() => res.status(200).json({ message: "Liked" }))
        .catch((error) => res.status(400).json({ error }));
      break;
    //like=0 selon userLiked et userDisliked ont modifient ses derniers
    case 0:
      Sauce.findOne({ _id: sauceId })
        .then(sauce => {
          if (sauce.usersLiked.includes(userId)) {
            //enlève le likes de la sauce 
            Sauce.updateOne({ _id: sauceId }, { $inc: { likes: -1 }, $pull: { usersLiked: userId } })
              .then(() => res.status(200).json({ message: "Removed mention !" }))
              .catch(error => res.status(400).json({ error }));
          } else if (sauce.usersDisliked.includes(userId)) {
            //enlève le dislikes de la sauce etu du tableau
            Sauce.updateOne({ _id: sauceId }, { $inc: { dislikes: -1 }, $pull: { usersDisliked: userId } })
              .then(() => res.status(200).json({ message: "Vous avez enlever votre dislike !" }))
              .catch(error => res.status(400).json({ error }));
          }
        })
        .catch(error => res.status(400).json({ error }));
      break;
    //like=1 = un dislikes pour la sauce est ajouté avec l'id de l'user dans usersDisliked
    case -1:
      Sauce.updateOne({ _id: sauceId }, { $inc: { dislikes: 1 }, $push: { usersDisliked: userId } })
        .then(() => res.status(200).json({ message: "Disliked" }))
        .catch((error) => res.status(400).json({ error }));
      break;
  }
}