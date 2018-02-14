-- phpMyAdmin SQL Dump
-- version 4.7.0
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 15-11-2017 a las 19:42:34
-- Versión del servidor: 10.1.25-MariaDB
-- Versión de PHP: 7.1.7

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `name`varchar(100) NOT NULL,
  `gender` varchar(10) NOT NULL,
  `dob` DATE, 
  `puntos` int(11),
  `img` mediumblob
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indices de la tabla `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de la tabla `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

-- status_code se refiere a si la solicitud ha sido aceptada 1, rechazada 2 o sigue pendiente 0.
CREATE TABLE `friends` (
  `id_user` int(11) NOT NULL,
  `id_friend` int(11) NOT NULL,
  `status_code` tinyint
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `questions`(
  `id_question` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `question` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `answers`(
  `id_answer`int(11) NOT NULL,
  `id_question` int(11) NOT NULL,
  `answer` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `own_answers`(
  `id_user` int(11) NOT NULL,
  `id_answer` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `users_answers`(
  `id_owner` int(11) NOT NULL,
  `id_player` int(11) NOT NULL,
  `id_answer` int(11) NOT NULL,
  `success` tinyint(1)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

ALTER TABLE `questions`
  ADD PRIMARY KEY (`id_question`);

ALTER TABLE `questions`
  ADD KEY (`id_user`);

ALTER TABLE `questions`
  ADD CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `questions`
  MODIFY `id_question` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

ALTER TABLE `answers`
  ADD PRIMARY KEY (`id_answer`);

ALTER TABLE `answers`
  ADD KEY(`id_question`);

ALTER TABLE `answers`
  ADD CONSTRAINT `answer_ibfk_1` FOREIGN KEY (`id_question`) REFERENCES `questions` (`id_question`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `answers`
  MODIFY `id_answer` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

ALTER TABLE `own_answers`
  ADD PRIMARY KEY (`id_user`, `id_answer`);

ALTER TABLE `own_answers`
  ADD CONSTRAINT `oa_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `own_answers`
  ADD CONSTRAINT `oa_ibfk_2` FOREIGN KEY (`id_answer`) REFERENCES `answers` (`id_answer`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `users_answers`
  ADD PRIMARY KEY (`id_owner`, `id_player`,`id_answer`);

ALTER TABLE `users_answers`
  ADD CONSTRAINT `ua_ibfk_1` FOREIGN KEY (`id_owner`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `users_answers`
  ADD CONSTRAINT `ua_ibfk_2` FOREIGN KEY (`id_player`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `users_answers`
  ADD CONSTRAINT `ua_ibfk_3` FOREIGN KEY (`id_answer`) REFERENCES `answers` (`id_answer`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `friends`
  ADD PRIMARY KEY (`id_user`,`id_friend`);

ALTER TABLE `friends`
  ADD CONSTRAINT `friends_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `friends`
  ADD CONSTRAINT `friends_ibfk_2` FOREIGN KEY (`id_friend`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;



CREATE TABLE `photos` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `photo` mediumblob,
  `descr`varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

ALTER TABLE `photos`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `photos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;
ALTER TABLE `photos`
  ADD CONSTRAINT `ohotos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;


COMMIT;
